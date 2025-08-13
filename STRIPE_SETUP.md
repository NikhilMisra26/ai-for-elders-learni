# Stripe Setup Guide for AI for Elders

This guide covers setting up Stripe Products, Prices, payment methods, and environment variables for both test and live modes.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Access to your Stripe Dashboard
3. Vercel account for production deployment

## Stripe Dashboard Setup

### 1. Create Products and Prices

#### Test Mode Setup

1. **Switch to Test Mode** in Stripe Dashboard (toggle in top-left)

2. **Create Products:**
   - Navigate to **Products** → **Add product**
   - Create two products:

   **Advanced Tier:**
   - Name: `AI for Elders - Advanced`
   - Description: `Advanced AI learning features and courses`
   - Pricing: Recurring → Monthly → $1.99

   **Expert Tier:**
   - Name: `AI for Elders - Expert`
   - Description: `Full access to all AI courses and premium features`
   - Pricing: Recurring → Monthly → $4.99

3. **Note the Price IDs:**
   - After creating each product, click on it
   - Copy the **Price ID** (starts with `price_`)
   - Advanced: `price_1234abcd...` (test mode)
   - Expert: `price_5678efgh...` (test mode)

#### Live Mode Setup

1. **Switch to Live Mode** in Stripe Dashboard
2. **Repeat the exact same process** as test mode
3. **Note the Live Price IDs:**
   - Advanced: `price_live_1234abcd...`
   - Expert: `price_live_5678efgh...`

### 2. Get API Keys

#### Test Mode Keys
- **Publishable Key**: `pk_test_...` (frontend-safe)
- **Secret Key**: `sk_test_...` (server-only)
- **Webhook Endpoint Secret**: `whsec_...` (server-only, after webhook setup)

#### Live Mode Keys
- **Publishable Key**: `pk_live_...` (frontend-safe)
- **Secret Key**: `sk_live_...` (server-only)
- **Webhook Endpoint Secret**: `whsec_live_...` (server-only, after webhook setup)

### 3. Webhook Setup

1. Go to **Developers** → **Webhooks**
2. **Add endpoint**:
   - **Test Mode URL**: `https://your-dev-domain.com/api/stripe/webhook`
   - **Live Mode URL**: `https://your-production-domain.com/api/stripe/webhook`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the Webhook Secret** for each environment

## Environment Variables Setup

### Variable Classification

#### Frontend-Safe Variables (use VITE_ prefix)
```bash
# Stripe Publishable Keys (safe to expose to client)
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...

# Price IDs (safe to expose to client)
VITE_PRICE_ID_ADVANCED_TEST=price_1234abcd...
VITE_PRICE_ID_EXPERT_TEST=price_5678efgh...
VITE_PRICE_ID_ADVANCED_LIVE=price_live_1234abcd...
VITE_PRICE_ID_EXPERT_LIVE=price_live_5678efgh...

# Environment flag
VITE_STRIPE_ENVIRONMENT=test  # or 'live' for production
```

#### Server-Only Variables (NO VITE_ prefix)
```bash
# Stripe Secret Keys (NEVER expose to client)
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...

# Webhook Secrets (server-only)
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_live_...
```

### Development Setup (.env.local)

Create `.env.local` in your project root:

```bash
# === STRIPE CONFIGURATION ===

# Environment (test or live)
VITE_STRIPE_ENVIRONMENT=test

# Frontend-Safe Variables (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_YOUR_PUBLISHABLE_KEY
VITE_PRICE_ID_ADVANCED_TEST=price_YOUR_ADVANCED_PRICE_ID
VITE_PRICE_ID_EXPERT_TEST=price_YOUR_EXPERT_PRICE_ID

# Frontend-Safe Variables (Live Mode)
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
VITE_PRICE_ID_ADVANCED_LIVE=price_YOUR_LIVE_ADVANCED_PRICE_ID
VITE_PRICE_ID_EXPERT_LIVE=price_YOUR_LIVE_EXPERT_PRICE_ID

# Server-Only Variables (Test Mode)
STRIPE_SECRET_KEY_TEST=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET_TEST=whsec_YOUR_WEBHOOK_SECRET

# Server-Only Variables (Live Mode)
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_LIVE_WEBHOOK_SECRET

# === OTHER ENVIRONMENT VARIABLES ===
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Switching Between Test and Live

Adjust `VITE_STRIPE_ENVIRONMENT` to choose which Stripe keys are loaded by `stripe-config.ts`:

```bash
# Default to Stripe test mode
VITE_STRIPE_ENVIRONMENT=test

# Enable live mode for production
VITE_STRIPE_ENVIRONMENT=live
```

### Production Setup (Vercel Dashboard)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add Frontend-Safe Variables** (Available to Browser):
   ```
   VITE_STRIPE_ENVIRONMENT = live
   VITE_STRIPE_PUBLISHABLE_KEY_TEST = pk_test_...
   VITE_STRIPE_PUBLISHABLE_KEY_LIVE = pk_live_...
   VITE_PRICE_ID_ADVANCED_TEST = price_...
   VITE_PRICE_ID_EXPERT_TEST = price_...
   VITE_PRICE_ID_ADVANCED_LIVE = price_live_...
   VITE_PRICE_ID_EXPERT_LIVE = price_live_...
   ```

3. **Add Server-Only Variables** (Server-side Functions only):
   ```
   STRIPE_SECRET_KEY_TEST = sk_test_...
   STRIPE_SECRET_KEY_LIVE = sk_live_...
   STRIPE_WEBHOOK_SECRET_TEST = whsec_...
   STRIPE_WEBHOOK_SECRET_LIVE = whsec_live_...
   ```

## Finding Your Price IDs

### Method 1: Stripe Dashboard
1. Go to **Products** in Stripe Dashboard
2. Click on your product
3. In the **Pricing** section, click on the price
4. Copy the **Price ID** (starts with `price_`)

### Method 2: Stripe CLI (if installed)
```bash
# List all prices in test mode
stripe prices list

# List all prices in live mode
stripe prices list --live
```

### Method 3: API Call
```bash
# Test mode
curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_SECRET_KEY:

# Live mode
curl https://api.stripe.com/v1/prices \
  -u sk_live_YOUR_SECRET_KEY:
```

## Environment-Specific Configuration

### Code Implementation Pattern

```typescript
// src/lib/stripe-config.ts
const isLive = import.meta.env.VITE_STRIPE_ENVIRONMENT === 'live';

export const stripeConfig = {
  publishableKey: isLive 
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE
    : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST,
  
  prices: {
    advanced: isLive 
      ? import.meta.env.VITE_PRICE_ID_ADVANCED_LIVE
      : import.meta.env.VITE_PRICE_ID_ADVANCED_TEST,
    
    expert: isLive 
      ? import.meta.env.VITE_PRICE_ID_EXPERT_LIVE
      : import.meta.env.VITE_PRICE_ID_EXPERT_TEST,
  }
};

// Server-side configuration
export const stripeSecretKey = isLive 
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

export const webhookSecret = isLive 
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;
```

## Testing Your Setup

### 1. Test Mode Verification
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any billing zip code

### 2. Environment Variable Check
```bash
# In your development environment
pnpm run dev

# Check browser console for:
console.log('Stripe Environment:', import.meta.env.VITE_STRIPE_ENVIRONMENT);
console.log('Publishable Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST);
```

### 3. Production Deployment Test
- Deploy to Vercel
- Verify environment variables are loaded
- Test with live mode (small amounts initially)

## Security Reminders

1. **NEVER** commit `.env.local` to version control
2. **NEVER** use `VITE_` prefix for secret keys
3. **ALWAYS** use test mode during development
4. **ALWAYS** validate webhooks with the webhook secret
5. **REGULARLY** rotate your API keys

## Next Steps

Once this setup is complete, you'll be ready for:
1. Stripe integration implementation
2. Subscription management
3. Webhook handling
4. Payment flow testing
5. Production deployment

## Troubleshooting

### Common Issues
- **Invalid Price ID**: Ensure you're using the correct test/live price ID for your environment
- **Webhook not working**: Verify the webhook URL is accessible and the secret is correct
- **CORS errors**: Check that your publishable key matches your environment
- **Environment variables not loading**: Restart your development server after adding new variables

### Verification Commands
```bash
# Check if environment variables are loaded
echo $VITE_STRIPE_ENVIRONMENT

# Verify Stripe CLI connection (if installed)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```