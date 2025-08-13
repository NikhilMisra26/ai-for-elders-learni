import { useEffect } from 'react';

import { getUserSubscription, upsertSubscription } from './db';
import { errorHandler } from './errorHandler';
import { subscriptionPlans, type SubscriptionPlan } from './subscription-plans';
import { SecurityLogger } from './security';
import { useKV } from './kv';
import type { PaymentMethod } from './payment-sim';

import { useAuth } from '@/contexts/AuthContext';

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

export function canAccessTier(
  subscription: UserSubscription,
  tier: 'free' | 'advanced' | 'expert',
): boolean {
  if (subscription.status === 'expired') return tier === 'free';
  const tierOrder = { free: 1, advanced: 2, expert: 3 };
  return tierOrder[subscription.planId] >= tierOrder[tier];
}

export function isTrialActive(subscription: UserSubscription): boolean {
  if (!subscription.trialEndDate) return false;
  return new Date() < new Date(subscription.trialEndDate);
}

export function isInGracePeriod(subscription: UserSubscription): boolean {
  if (!subscription.gracePeriodEnd) return false;
  return new Date() < new Date(subscription.gracePeriodEnd);
}

export function getDaysUntilExpiry(
  subscription: UserSubscription,
): number | null {
  if (!subscription.endDate) return null;
  const now = new Date();
  const expiry = new Date(subscription.endDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

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
    setSubscription((current) => ({
      ...current,
      ...updates,
    }));

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
      }).catch((error) => {
        SecurityLogger.log('upsertSubscription failed', { error }, 'error');
        errorHandler.handlePaymentError(
          'update subscription',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.id,
            metadata: {
              planId: base.planId,
              status: base.status,
              operation: 'upsert_subscription',
            },
          },
        );
      });
    }
  };

  const getCurrentPlan = (): SubscriptionPlan => {
    return (
      subscriptionPlans.find((plan) => plan.id === subscription.planId) ??
      subscriptionPlans[0]
    );
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
    canAccessTier: (tier) => canAccessTier(subscription, tier),
    isTrialActive: () => isTrialActive(subscription),
    isInGracePeriod: () => isInGracePeriod(subscription),
    getDaysUntilExpiry: () => getDaysUntilExpiry(subscription),
    startTrial,
    upgradeToPaid,
    cancelSubscription,
    reactivateSubscription,
  };
}
