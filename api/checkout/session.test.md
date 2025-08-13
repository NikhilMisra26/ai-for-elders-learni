# Stripe Checkout Session API - Security Test Guide

## Overview

This document provides test cases to verify the security of the `/api/checkout/session` endpoint.

## Environment Setup

1. Install dependencies:

```bash
pnpm install
pnpm install -D @vercel/node
```

2. Set environment variables in Vercel Dashboard:

- `STRIPE_SECRET_KEY` - Your Stripe secret key (test mode)
- `PRICE_ID_ADVANCED` - Stripe price ID for Advanced plan
- `PRICE_ID_EXPERT` - Stripe price ID for Expert plan
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_APP_URL` - Your production URL (optional)

## Security Test Cases

### 1. Method Validation

```bash
# Should return 405 Method Not Allowed
curl -X GET https://your-app.vercel.app/api/checkout/session
curl -X PUT https://your-app.vercel.app/api/checkout/session
curl -X DELETE https://your-app.vercel.app/api/checkout/session
```

### 2. Authentication Required

```bash
# Should return 401 Unauthorized - No token
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -d '{"plan":"advanced"}'

# Should return 401 Unauthorized - Invalid token format
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: InvalidToken" \
  -d '{"plan":"advanced"}'

# Should return 401 Unauthorized - Invalid JWT
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.jwt.token" \
  -d '{"plan":"advanced"}'
```

### 3. Input Validation

```bash
# Should return 400 Bad Request - Invalid plan
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d '{"plan":"invalid"}'

# Should return 400 Bad Request - Missing plan
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d '{}'

# Should return 400 Bad Request - Invalid JSON
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d 'invalid json'
```

### 4. Duplicate Subscription Prevention

```bash
# First request should succeed (if user has no active subscription)
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d '{"plan":"advanced"}'

# Second request should return 400 if user already has subscription
```

### 5. Security Headers Verification

```bash
# Check response headers
curl -I -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d '{"plan":"advanced"}'

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'
# Cache-Control: no-store, no-cache, must-revalidate, private
# Referrer-Policy: strict-origin-when-cross-origin
```

### 6. Successful Request

```bash
# Valid request with proper authentication
curl -X POST https://your-app.vercel.app/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_JWT_TOKEN" \
  -d '{"plan":"advanced"}'

# Expected response:
{
  "success": true,
  "url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_...",
  "timestamp": "2024-01-15T..."
}
```

### 7. Rate Limiting (if implemented)

```bash
# Send multiple rapid requests to test rate limiting
for i in {1..20}; do
  curl -X POST https://your-app.vercel.app/api/checkout/session \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VALID_JWT_TOKEN" \
    -d '{"plan":"advanced"}' &
done
```

## Client-Side Integration Test

```typescript
import {
  createCheckoutSession,
  redirectToCheckout,
} from '@/lib/stripe-checkout';

// Test creating a session
try {
  const url = await createCheckoutSession('advanced');
  console.log('Checkout URL:', url);
} catch (error) {
  console.error('Error:', error);
}

// Test redirect
try {
  await redirectToCheckout('expert');
  // User will be redirected to Stripe Checkout
} catch (error) {
  console.error('Redirect failed:', error);
}
```

## Security Checklist

- ✅ Only POST method allowed
- ✅ JWT authentication required
- ✅ Token validation with Supabase
- ✅ Input validation (plan parameter)
- ✅ Duplicate subscription prevention
- ✅ Security headers on all responses
- ✅ Generic error messages (no info leakage)
- ✅ Request body size limit (1MB)
- ✅ Session expiration (30 minutes)
- ✅ Proper CORS configuration
- ✅ Environment variables for secrets
- ✅ Secure logging (no sensitive data)
- ✅ HTTPS enforcement via headers

## Monitoring Recommendations

1. Log all checkout attempts with user ID and timestamp
2. Monitor for unusual patterns (rapid requests, multiple failed attempts)
3. Set up alerts for authentication failures
4. Track conversion rates and abandonment
5. Monitor for security header violations

## Production Deployment

1. Update environment variables in Vercel with production Stripe keys
2. Test with Stripe test cards before going live
3. Enable Stripe webhook for subscription updates
4. Implement additional rate limiting if needed
5. Set up monitoring and alerting
