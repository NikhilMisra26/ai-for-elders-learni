import { strict as assert } from 'assert';
import {
  canAccessTier,
  isTrialActive,
  isInGracePeriod,
  getDaysUntilExpiry,
  type UserSubscription,
} from '../src/lib/useSubscription';

const base: UserSubscription = {
  planId: 'advanced',
  status: 'active',
  startDate: new Date().toISOString(),
  autoRenew: true,
};

assert.equal(canAccessTier(base, 'free'), true);
assert.equal(canAccessTier(base, 'expert'), false);

const trial: UserSubscription = {
  ...base,
  status: 'trial',
  trialEndDate: new Date(Date.now() + 86400000).toISOString(),
};
assert.equal(isTrialActive(trial), true);

const grace: UserSubscription = {
  ...base,
  gracePeriodEnd: new Date(Date.now() + 86400000).toISOString(),
};
assert.equal(isInGracePeriod(grace), true);

const expiring: UserSubscription = {
  ...base,
  endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
};
assert.equal(getDaysUntilExpiry(expiring), 5);

console.log('useSubscription helper tests passed');
