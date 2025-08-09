import { useEffect } from 'react';

import { useKV } from './kv';
import {
  addInvoice as dbAddInvoice,
  getUserSubscription,
  upsertSubscription,
} from './db';
import { SecurityLogger } from './security';

import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionPlan {
  id: 'free' | 'advanced' | 'expert';
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  features: string[];
  description: string;
  ctaText: string;
  popular?: boolean;
}

export interface UserSubscription {
  planId: 'free' | 'advanced' | 'expert';
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'grace_period';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  trialEndDate?: string;
  gracePeriodEnd?: string;
  paymentMethod?: {
    type: 'card';
    last4: string;
    brand: string;
  };
  cancelAtPeriodEnd?: boolean;
  autoRenew: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Course',
    price: 0,
    billingPeriod: 'month',
    description: 'Perfect for getting started with AI basics',
    ctaText: 'Start Learning Free',
    features: [
      'Complete "AI Basics for Everyday Life" course',
      '4 comprehensive modules',
      'Audio narration for all content',
      'Progress tracking',
      'Community forum access',
      'Email support',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Learning',
    price: 1.99,
    billingPeriod: 'month',
    description: 'Take your AI skills to the next level',
    ctaText: 'Upgrade to Advanced',
    popular: true,
    features: [
      'Everything in Free course',
      '"AI as Your Personal Assistant" course',
      'Advanced prompting techniques',
      'AI tools and apps guidance',
      'Health & finance applications',
      'Monthly AI updates',
      'Priority email support',
      '7-day free trial',
    ],
  },
  {
    id: 'expert',
    name: 'Expert Mastery',
    price: 4.99,
    billingPeriod: 'month',
    description: 'Master cutting-edge AI technologies',
    ctaText: 'Become an Expert',
    features: [
      'Everything in Advanced plan',
      '"Advanced AI for Active Seniors" course',
      'Autonomous AI agents',
      'Custom AI assistants',
      'Model Context Protocol (MCP)',
      'Cutting-edge updates',
      'Live expert Q&A sessions',
      'Phone support',
      '14-day free trial',
    ],
  },
];

// Subscription management hooks and utilities
export function useSubscription(): {
  subscription: UserSubscription;
  updateSubscription: (updates: Partial<UserSubscription>) => void;
  getCurrentPlan: () => SubscriptionPlan;
  canAccessTier: (tier: 'free' | 'advanced' | 'expert') => boolean;
  isTrialActive: () => boolean;
  isInGracePeriod: () => boolean;
  getDaysUntilExpiry: () => number | null;
  startTrial: (planId: 'advanced' | 'expert') => void;
  upgradeToPaid: (
    planId: 'advanced' | 'expert',
    paymentMethod?: PaymentMethod,
  ) => void;
  cancelSubscription: (immediate?: boolean) => void;
  reactivateSubscription: () => void;
} {
  const { user } = useAuth();
  const [subscription, setSubscription] = useKV<UserSubscription>(
    'user-subscription',
    {
      planId: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      autoRenew: true,
    },
  );

  // Hydrate from Supabase when logged in
  useEffect(() => {
    if (!user) return;
    void (async (): Promise<void> => {
      try {
        const row = await getUserSubscription(user.id);
        if (row) {
          setSubscription({
            planId: row.plan_id,
            status: row.status,
            startDate: row.start_date,
            endDate: row.end_date ?? undefined,
            nextBillingDate: row.next_billing_date ?? undefined,
            trialEndDate: row.trial_end_date ?? undefined,
            gracePeriodEnd: row.grace_period_end ?? undefined,
            paymentMethod:
              row.payment_last4 && row.payment_brand
                ? {
                    type: 'card',
                    last4: row.payment_last4,
                    brand: row.payment_brand,
                  }
                : undefined,
            cancelAtPeriodEnd: row.cancel_at_period_end,
            autoRenew: row.auto_renew,
          });
        }
      } catch {
        // ignore fetch errors
      }
    })();
  }, [user, setSubscription]);

  const updateSubscription = (updates: Partial<UserSubscription>): void => {
    setSubscription((current) => ({
      ...current,
      ...updates,
    }));

    // Persist if logged in
    if (user) {
      const base: UserSubscription = { ...subscription, ...updates };
      upsertSubscription({
        user_id: user.id,
        plan_id: base.planId,
        status: base.status,
        start_date: base.startDate,
        end_date: base.endDate ?? null,
        next_billing_date: base.nextBillingDate ?? null,
        trial_end_date: base.trialEndDate ?? null,
        grace_period_end: base.gracePeriodEnd ?? null,
        payment_brand: base.paymentMethod?.brand ?? null,
        payment_last4: base.paymentMethod?.last4 ?? null,
        cancel_at_period_end: base.cancelAtPeriodEnd ?? false,
        auto_renew: base.autoRenew,
      }).catch((error) =>
        SecurityLogger.log('upsertSubscription failed', { error }, 'error'),
      );
    }
  };

  const getCurrentPlan = (): SubscriptionPlan => {
    return (
      subscriptionPlans.find((plan) => plan.id === subscription.planId) ??
      subscriptionPlans[0]
    );
  };

  const canAccessTier = (tier: 'free' | 'advanced' | 'expert'): boolean => {
    if (subscription.status === 'expired') return tier === 'free';

    const tierOrder = { free: 1, advanced: 2, expert: 3 };
    const currentLevel = tierOrder[subscription.planId];
    const requestedLevel = tierOrder[tier];

    return currentLevel >= requestedLevel;
  };

  const isTrialActive = (): boolean => {
    if (!subscription.trialEndDate) return false;
    return new Date() < new Date(subscription.trialEndDate);
  };

  const isInGracePeriod = (): boolean => {
    if (!subscription.gracePeriodEnd) return false;
    return new Date() < new Date(subscription.gracePeriodEnd);
  };

  const getDaysUntilExpiry = (): number | null => {
    if (!subscription.endDate) return null;
    const now = new Date();
    const expiry = new Date(subscription.endDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const startTrial = (planId: 'advanced' | 'expert'): void => {
    const trialDays = planId === 'advanced' ? 7 : 14;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    updateSubscription({
      planId,
      status: 'trial',
      trialEndDate: trialEndDate.toISOString(),
      startDate: new Date().toISOString(),
    });
  };

  const upgradeToPaid = (
    planId: 'advanced' | 'expert',
    paymentMethod?: PaymentMethod,
  ): void => {
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    updateSubscription({
      planId,
      status: 'active',
      nextBillingDate: nextBillingDate.toISOString(),
      paymentMethod: paymentMethod
        ? {
            type: paymentMethod.type,
            last4: paymentMethod.last4,
            brand: paymentMethod.brand,
          }
        : undefined,
      trialEndDate: undefined,
      autoRenew: true,
    });
  };

  const cancelSubscription = (immediate = false): void => {
    if (immediate) {
      updateSubscription({
        planId: 'free',
        status: 'active',
        endDate: undefined,
        nextBillingDate: undefined,
        cancelAtPeriodEnd: false,
        paymentMethod: undefined,
      });
    } else {
      updateSubscription({
        cancelAtPeriodEnd: true,
        autoRenew: false,
      });
    }
  };

  const reactivateSubscription = (): void => {
    updateSubscription({
      cancelAtPeriodEnd: false,
      autoRenew: true,
      status: 'active',
    });
  };

  return {
    subscription,
    updateSubscription,
    getCurrentPlan,
    canAccessTier,
    isTrialActive,
    isInGracePeriod,
    getDaysUntilExpiry,
    startTrial,
    upgradeToPaid,
    cancelSubscription,
    reactivateSubscription,
  };
}

// Payment simulation utilities
export async function simulatePaymentFlow(planId: string): Promise<{
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}> {
  return new Promise((resolve) => {
    // Simulate payment processing delay
    setTimeout((): void => {
      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        const paymentMethod: PaymentMethod = {
          id: `pm_${Date.now()}`,
          type: 'card',
          last4: Math.floor(Math.random() * 9000 + 1000).toString(),
          brand: ['visa', 'mastercard', 'amex'][Math.floor(Math.random() * 3)],
          expiry: '12/28',
          isDefault: true,
        };
        resolve({ success: true, paymentMethod });
      } else {
        resolve({
          success: false,
          error:
            'Payment failed. Please check your card details and try again.',
        });
      }
    }, 2000); // 2 second delay to simulate processing
  });
}

export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

export function formatBillingPeriod(period: 'month' | 'year'): string {
  return period === 'month' ? '/month' : '/year';
}

export function getPlanFeatures(
  planId: 'free' | 'advanced' | 'expert',
): string[] {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  return plan?.features ?? [];
}

export function getUpgradeRecommendation(
  currentPlan: 'free' | 'advanced' | 'expert',
): SubscriptionPlan | null {
  if (currentPlan === 'free')
    return subscriptionPlans.find((p) => p.id === 'advanced') ?? null;
  if (currentPlan === 'advanced')
    return subscriptionPlans.find((p) => p.id === 'expert') ?? null;
  return null;
}

// Billing and invoice utilities
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl?: string;
}

export function useInvoiceHistory(): {
  invoices: Invoice[];
  addInvoice: (planId: 'advanced' | 'expert', amount: number) => void;
} {
  const [invoices, setInvoices] = useKV<Invoice[]>('user-invoices', []);
  const { user } = useAuth();

  useEffect(() => {
    // Could fetch invoices from Supabase here for logged-in user; keeping simple
  }, [user]);

  const addInvoice = (planId: 'advanced' | 'expert', amount: number): void => {
    const plan = subscriptionPlans.find((p) => p.id === planId);
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      planName: plan?.name ?? 'Unknown Plan',
      status: 'paid',
    };

    setInvoices((current) => [newInvoice, ...current].slice(0, 12)); // Keep last 12 invoices

    if (user) {
      dbAddInvoice({
        user_id: user.id,
        date: new Date().toISOString(),
        amount,
        plan_name: plan?.name ?? 'Unknown Plan',
        status: 'paid',
        download_url: null,
      }).catch(() => {
        // ignore persist errors
      });
    }
  };

  return { invoices, addInvoice };
}
