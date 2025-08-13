import { strict as assert } from 'assert';
import {
  subscriptionPlans,
  formatPrice,
  formatBillingPeriod,
  getPlanFeatures,
  getUpgradeRecommendation,
} from '../src/lib/subscription-plans';

assert.equal(subscriptionPlans.length, 3);
assert.equal(formatPrice(0), 'Free');
assert.equal(formatPrice(4.99), '$4.99');
assert.equal(formatBillingPeriod('month'), '/month');
assert.ok(getPlanFeatures('free').length > 0);
assert.equal(getUpgradeRecommendation('free')?.id, 'advanced');
assert.equal(getUpgradeRecommendation('expert'), null);

console.log('subscription-plans tests passed');
