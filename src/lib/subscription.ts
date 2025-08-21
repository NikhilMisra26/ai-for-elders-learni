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
  // Start of removed/added code for subscription removal
  {
    id: 'advanced',
    name: 'Advanced Learning',
    price: 1.99,
    billingPeriod: 'month',
    description: 'Take your AI skills to the next level',
    // Removed for subscription removal: ctaText: 'Upgrade to Advanced',
    ctaText: 'Coming Soon', // Added for subscription removal
    popular: true,
    // Removed for subscription removal: original features array, restored for better UX
    features: [
      'Everything in Free course',
      '"AI as Your Personal Assistant" course',
      'Advanced prompting techniques',
      'AI tools and apps guidance',
      'Health & finance applications',
      'Monthly AI updates',
      'Priority email support',
    ], // Added for subscription removal
  },
  // End of removed/added code for subscription removal
  // Start of removed/added code for subscription removal
  {
    id: 'expert',
    name: 'Expert Mastery',
    price: 4.99,
    billingPeriod: 'month',
    // Removed for subscription removal: description: 'Master cutting-edge AI technologies',
    description: 'Master cutting-edge AI technologies', // Added for subscription removal
    // Removed for subscription removal: ctaText: 'Become an Expert',
    ctaText: 'Coming Soon', // Added for subscription removal
    // Removed for subscription removal: original features array, restored for better UX
    features: [
      'Everything in Advanced plan',
      '"Advanced AI for Active Seniors" course',
      'Autonomous AI agents',
      'Custom AI assistants',
      'Model Context Protocol (MCP)',
      'Cutting-edge updates',
      'Live expert Q&A sessions',
    ], // Added for subscription removal
  },
  // End of removed/added code for subscription removal
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
  upgradeToPaid: (planId: 'advanced' | 'expert', paymentMethod?: PaymentMethod) => void;
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
    // Start of removed/added code for subscription removal
    // Removed for subscription removal: original tier access logic
    /*
    if (subscription.status === 'expired') return tier === 'free';

    const tierOrder = { free: 1, advanced: 2, expert: 3 };
    const currentLevel = tierOrder[subscription.planId];
    const requestedLevel = tierOrder[tier];

    return currentLevel >= requestedLevel;
    */
    // Added for subscription removal: only allow free tier access
    return tier === 'free';
    // End of removed/added code for subscription removal
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

  // Start of removed/added code for subscription removal
  // Removed for subscription removal: startTrial function implementation
  const startTrial = (_planId: 'advanced' | 'expert'): void => {
    /*
    const trialDays = planId === 'advanced' ? 7 : 14;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    updateSubscription({
      planId,
      status: 'trial',
      trialEndDate: trialEndDate.toISOString(),
      startDate: new Date().toISOString(),
    });
    */
    // Added for subscription removal: no-op function
    // Trial functionality temporarily disabled
    return;
  };
  // End of removed/added code for subscription removal

  // Start of removed/added code for subscription removal
  // Removed for subscription removal: upgradeToPaid function implementation
  const upgradeToPaid = (_planId: 'advanced' | 'expert', _paymentMethod?: PaymentMethod): void => {
    /*
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
    */
    // Added for subscription removal: no-op function
    // Upgrade functionality temporarily disabled
    return;
  };
  // End of removed/added code for subscription removal

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
// Start of removed/added code for subscription removal
// Removed for subscription removal: simulatePaymentFlow function implementation
export async function simulatePaymentFlow(_planId: string): Promise<{
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}> {
  /*
  return new Promise((resolve) => {
    // Simulate payment processing delay
    setTimeout((): void => {
      // Use planId for consistent simulation based on plan
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
  */
  // Added for subscription removal: return failure immediately
  return Promise.resolve({
    success: false,
    error: 'Payment functionality is currently disabled. Only free tier is available.',
  });
}
// End of removed/added code for subscription removal

export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

export function formatBillingPeriod(period: 'month' | 'year'): string {
  return period === 'month' ? '/month' : '/year';
}

export function getPlanFeatures(planId: 'free' | 'advanced' | 'expert'): string[] {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  return plan?.features ?? [];
}

export function getUpgradeRecommendation(
  currentPlan: 'free' | 'advanced' | 'expert',
): SubscriptionPlan | null {
  if (currentPlan === 'free') return subscriptionPlans.find((p) => p.id === 'advanced') ?? null;
  if (currentPlan === 'advanced') return subscriptionPlans.find((p) => p.id === 'expert') ?? null;
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
