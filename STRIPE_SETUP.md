# Stripe Payment Integration Setup Guide for AI for Elders

## Overview

This guide helps you set up Stripe payment processing for the AI for Elders platform. Key points to remember:

⚠️ **Important Safety Notes**:
- **NO FREE TRIALS**: Users are charged immediately upon checkout
- **Security Critical**: Keep all secret keys confidential
- **Test Before Going Live**: Always thoroughly test in Stripe's test mode

## Prerequisites

- Stripe Account
- Node.js and npm installed
- Supabase project set up
- Basic understanding of payment integration

## Step-by-Step Setup

### 1. Create Stripe Account 🌐

1. Visit [https://stripe.com](https://stripe.com) and create an account
2. Complete your business profile
3. **Activate your account**

### 2. Test Environment Setup 🧪

⚠️ Safety Warning: Always start in TEST MODE to prevent real charges!

#### How to Enable Test Mode:
1. Log into Stripe Dashboard
2. Look for the "Test mode" toggle (usually top right)
3. When enabled, all keys will start with `test_`

#### Test Payment Cards 💳
- **Successful Payment**: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVV: Any 3 digits
- **Simulate Different Scenarios**:
  - Declined card: `4000 0000 0000 0002`
  - Insufficient funds: `4000 0000 0000 9995`

### 3. Create Stripe Products and Prices

In Stripe Dashboard, navigate to **Products** and create:

#### Advanced Learning Plan
- **Name**: Advanced Learning
- **Description**: AI as Your Personal Assistant course
- **Price**: $1.99/month
- **Recurring**: Monthly

#### Expert Mastery Plan
- **Name**: Expert Mastery
- **Description**: Advanced AI for Active Seniors
- **Price**: $4.99/month
- **Recurring**: Monthly

### 4. Configure Environment Variables

#### Frontend `.env.local`:
```bash
# Stripe Test Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
```

#### Backend `server/.env`:
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_ADVANCED=price_test_ADVANCED_PRICE
STRIPE_PRICE_EXPERT=price_test_EXPERT_PRICE

# Supabase Details
SUPABASE_URL=your_test_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
```

### 5. Update Price IDs in Code

Edit `src/lib/stripe.ts`:

```typescript
export const STRIPE_PRICES = {
  advanced: {
    monthly: 'price_test_ADVANCED_PRICE', // Test price ID
    priceId: 'price_test_ADVANCED_PRICE',
    amount: 199, // $1.99 in cents
  },
  expert: {
    monthly: 'price_test_EXPERT_PRICE', // Test price ID
    priceId: 'price_test_EXPERT_PRICE',
    amount: 499, // $4.99 in cents
  },
};
```

### 6. Webhook Configuration 🔗

⚠️ Security Warning: Use ngrok for local webhook testing!

#### Local Webhook Steps:
1. Install ngrok: `npm install -g ngrok`
2. Start backend server: `npm run dev`
3. In another terminal, run: `ngrok http 3001`
4. Copy the HTTPS URL from ngrok
5. In Stripe Dashboard:
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - Paste ngrok HTTPS URL
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### 7. Testing Workflow 🧪

1. Start backend: `npm run dev`
2. Start frontend: `pnpm run dev`
3. Create test user account
4. Attempt plan upgrade
5. Use test payment card
6. Verify:
   - Successful redirection
   - User tier update
   - Access to premium content

## Troubleshooting Checklist 🛠️

### Common Issues
- **Webhook not working**:
  1. Check ngrok URL is current
  2. Verify webhook secret
  3. Check server logs
  4. Ensure server is running

- **Payment not processing**:
  1. Confirm you're in TEST mode
  2. Verify price IDs match
  3. Check console for errors
  4. Validate CORS settings

### Local Webhook Debugging
- Use `ngrok http 3001` to expose local server
- Monitor webhook attempts in Stripe Dashboard
- Check server console for detailed logs

## Production Migration Checklist ✅

Before going live:
- [ ] Switch to live Stripe keys
- [ ] Update all price IDs to production versions
- [ ] Conduct thorough payment flow testing
- [ ] Verify webhook signature validation
- [ ] Set up monitoring for transactions
- [ ] Configure Stripe email receipts
- [ ] Enable fraud protection (Stripe Radar)

## Security Reminders 🔒

- NEVER commit secret keys to version control
- Rotate webhook secrets periodically
- Use environment-specific configurations
- Implement rate limiting on payment endpoints

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Mode Guide](https://stripe.com/docs/test-mode)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

## Support

For integration issues, contact:
- Stripe Support
- Your development team's payment integration specialist