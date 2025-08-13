import { strict as assert } from 'assert';
import { simulatePaymentFlow } from '../src/lib/payment-sim';

async function run(): Promise<void> {
  const originalRandom = Math.random;
  Math.random = () => 0.9;
  const result = await simulatePaymentFlow('advanced');
  Math.random = originalRandom;
  assert.equal(result.success, true);
  assert.ok(result.paymentMethod);
  console.log('payment-sim tests passed');
}

run();
