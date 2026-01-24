import { useEffect, useState } from 'react';

import { addInvoice as dbAddInvoice, getUserSubscription, upsertSubscription } from './db';
import { SecurityLogger } from './security';
import { errorHandler } from './errorHandler';

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

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Basic Course',
    price: 0,
    billingPeriod: 'month',
    description: 'Perfect for getting started with AI basics',
    ctaText: 'Start Learning Free',
    features: [
      'Complete "AI Basics for Everyday Life" course',
      '4 comprehensive modules',
      'Audio narration for all content',
      'Progress tracking',
      'Health applications',
      'Tools and Techniques to enhance communication with children and grandchildren',
      'Email support',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Learning',
    price: 1.99,
    billingPeriod: 'month',
    description: 'Take your AI skills to the next level',
    ctaText: 'Coming Soon',
    popular: true,
    features: [
      'Everything in Free course',
      '"AI as Your Personal Assistant" course',
      'Advanced prompting techniques',
      'AI tools and apps guidance',
      'Health & finance applications',
      'Monthly AI updates',
      'Priority email support',
    ],
  },
  {
    id: 'expert',
    name: 'Expert Mastery',
    price: 4.99,
    billingPeriod: 'month',
    description: 'Master cutting-edge AI technologies',
    ctaText: 'Coming Soon',
    features: [
      'Everything in Advanced plan',
      '"Advanced AI for Active Seniors" course',
      'Autonomous AI agents',
      'Custom AI assistants',
      'Model Context Protocol (MCP)',
      'Cutting-edge updates',
      'Live expert Q&A sessions',
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
  cancelSubscription: (immediate?: boolean) => void;
  reactivateSubscription: () => void;
} {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>({
    planId: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
    autoRenew: true,
  });

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
      } catch (error) {
        errorHandler.handleDatabaseError(
          'fetch user subscription',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.id,
            component: 'subscription',
          },
        );
      }
    })();
  }, [user, setSubscription]);

  const updateSubscription = (updates: Partial<UserSubscription>): void => {
    // Compute next state once to avoid race condition
    const nextState: UserSubscription = { ...subscription, ...updates };

    // Update local state
    setSubscription(nextState);

    // Persist if logged in
    if (user) {
      upsertSubscription({
        user_id: user.id,
        plan_id: nextState.planId,
        status: nextState.status,
        start_date: nextState.startDate,
        end_date: nextState.endDate ?? null,
        next_billing_date: nextState.nextBillingDate ?? null,
        trial_end_date: nextState.trialEndDate ?? null,
        grace_period_end: nextState.gracePeriodEnd ?? null,
        payment_brand: nextState.paymentMethod?.brand ?? null,
        payment_last4: nextState.paymentMethod?.last4 ?? null,
        cancel_at_period_end: nextState.cancelAtPeriodEnd ?? false,
        auto_renew: nextState.autoRenew,
      }).catch((error) => {
        // Log both to security logger and error handler for comprehensive tracking
        SecurityLogger.log('upsertSubscription failed', { error }, 'error');
        errorHandler.handlePaymentError(
          'update subscription',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.id,
            metadata: {
              planId: nextState.planId,
              status: nextState.status,
              operation: 'upsert_subscription',
            },
          },
        );
      });
    }
  };

  const getCurrentPlan = (): SubscriptionPlan => {
    return (
      subscriptionPlans.find((plan) => plan.id === subscription.planId) ?? subscriptionPlans[0]
    );
  };

  const canAccessTier = (tier: 'free' | 'advanced' | 'expert'): boolean => {
    return tier === 'free';
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
    cancelSubscription,
    reactivateSubscription,
  };
}

export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

    setInvoices((current: Invoice[]) => [newInvoice, ...current].slice(0, 12)); // Keep last 12 invoices

    if (user) {
      dbAddInvoice({
        user_id: user.id,
        date: new Date().toISOString(),
        amount,
        plan_name: plan?.name ?? 'Unknown Plan',
        status: 'paid',
        download_url: null,
      }).catch((error) => {
        errorHandler.handleDatabaseError(
          'add invoice to database',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.id,
            component: 'invoice',
            metadata: {
              amount,
              planName: plan?.name ?? 'Unknown Plan',
            },
          },
        );
      });
    }
  };

  return { invoices, addInvoice };
}
