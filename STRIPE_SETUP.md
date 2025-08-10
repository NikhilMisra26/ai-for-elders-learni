# Stripe Payment Integration Setup Guide

## Overview
This application uses Stripe for payment processing with **NO FREE TRIALS**. Users must pay immediately to access premium content. The integration handles subscriptions automatically and updates user access levels based on payment status.

## Required Setup Steps

### 1. Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete your business profile and activate your account

### 2. Create Products and Prices in Stripe Dashboard

Navigate to **Products** in your Stripe Dashboard and create:

#### Advanced Learning Plan
- **Name**: Advanced Learning
- **Description**: AI as Your Personal Assistant course with advanced techniques
- **Price**: $1.99/month
- **Recurring**: Monthly
- **Price ID**: Note this ID (will look like `price_1234567890abcdef`)

#### Expert Mastery Plan
- **Name**: Expert Mastery
- **Description**: Advanced AI for Active Seniors with cutting-edge content
- **Price**: $4.99/month
- **Recurring**: Monthly
- **Price ID**: Note this ID (will look like `price_1234567890ghijkl`)

### 3. Update Price IDs in Code

Edit `src/lib/stripe.ts` and update the price IDs:

```typescript
export const STRIPE_PRICES = {
  advanced: {
    monthly: 'price_YOUR_ADVANCED_PRICE_ID', // Replace with actual
    priceId: 'price_YOUR_ADVANCED_PRICE_ID',
    amount: 199, // in cents
  },
  expert: {
    monthly: 'price_YOUR_EXPERT_PRICE_ID', // Replace with actual
    priceId: 'price_YOUR_EXPERT_PRICE_ID',
    amount: 499, // in cents
  },
};
```

### 4. Configure Environment Variables

Add to your `.env.local`:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
```

### 5. Set Up Backend Server

#### Navigate to server directory
```bash
cd server
```

#### Install dependencies
```bash
npm install
```

#### Configure environment
Copy `server/.env.example` to `server/.env` and add:
```bash
PORT=3001
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173

# Add your actual Stripe price IDs
STRIPE_PRICE_ADVANCED=price_YOUR_ADVANCED_PRICE_ID
STRIPE_PRICE_EXPERT=price_YOUR_EXPERT_PRICE_ID
```

#### Start the backend server
```bash
npm run dev  # For development with auto-reload
# or
npm start    # For production
```

### 6. Configure Stripe Webhook

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: 
   - For local testing: Use [ngrok](https://ngrok.com) to expose your local server: `https://YOUR_NGROK_URL/webhook`
   - For production: `https://YOUR_DOMAIN.com/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to your `server/.env` file as `STRIPE_WEBHOOK_SECRET`

### 7. Run Database Migrations

In Supabase SQL Editor, run:
```sql
-- Run the migrations from:
-- 1. supabase.schema.sql (base schema)
-- 2. supabase/migrations/002_add_stripe_fields.sql (Stripe fields)
```

### 8. Configure Customer Portal

1. Go to **Settings → Billing → Customer portal** in Stripe
2. Enable the customer portal
3. Configure what customers can do:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Download invoices
4. Save settings

## Testing the Integration

### Test Mode
1. Use Stripe test mode first (toggle in Dashboard)
2. Test API keys start with `pk_test_` and `sk_test_`
3. Use test card: `4242 4242 4242 4242` with any future expiry

### Test Flow
1. Create a new user account
2. Click "Upgrade Plan" 
3. You'll be redirected to Stripe Checkout
4. Complete payment (immediate charge, no trial)
5. On success, redirected back to account page
6. User tier automatically updated via webhook
7. Premium content immediately accessible

### Verify Webhook
Check webhook logs in Stripe Dashboard under **Developers → Webhooks → [Your endpoint] → Webhook attempts**

## Important Notes

- **NO FREE TRIALS**: Users are charged immediately upon checkout
- **Automatic Tier Updates**: Webhooks update user access automatically
- **Subscription Management**: Users can manage subscriptions via Stripe Customer Portal
- **Security**: Never expose secret keys in client code
- **RLS Policies**: Database enforces subscription checks at row level

## Troubleshooting

### Payment not updating user tier
1. Check webhook logs in Stripe Dashboard
2. Verify webhook secret is correct in `server/.env`
3. Check server console for webhook processing logs
4. Ensure server is running and accessible

### Checkout session fails
1. Verify price IDs are correct in both `src/lib/stripe.ts` and `server/.env`
2. Check server console for errors
3. Ensure backend server is running on port 3001
4. Verify CORS settings if frontend/backend on different ports

### Customer portal not opening
1. Ensure portal is activated in Stripe settings
2. Verify user has stripe_customer_id in database
3. Check server console for portal session creation errors

### Local Testing with Webhooks
1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3001`
3. Use the HTTPS URL from ngrok as your webhook endpoint in Stripe
4. Update `STRIPE_WEBHOOK_SECRET` with the test webhook secret

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update all price IDs to live versions
- [ ] Test full payment flow with real card
- [ ] Verify webhook signature validation
- [ ] Monitor first few real transactions
- [ ] Set up Stripe email receipts
- [ ] Configure tax settings if needed
- [ ] Enable Stripe Radar for fraud protection