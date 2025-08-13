import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutSessionSchema } from '../../../dist/stripe-checkout.js';

test('parses valid checkout session response', () => {
  const result = checkoutSessionSchema.safeParse({
    success: true,
    url: 'https://example.com',
    session_id: 'sess',
    timestamp: '2025-01-01T00:00:00Z',
  });
  assert.equal(result.success, true);
});

test('fails to parse invalid checkout session response', () => {
  const result = checkoutSessionSchema.safeParse({ success: true });
  assert.equal(result.success, false);
});
