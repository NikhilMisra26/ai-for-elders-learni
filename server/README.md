# AI for Elders - Backend Server

This is the Node.js/Express backend server that handles Stripe payment processing for the AI for Elders platform.

## Features

- Stripe checkout session creation
- Stripe customer portal management
- Webhook handling for automatic subscription updates
- Database synchronization with Supabase

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Stripe and Supabase credentials

3. **Run the server:**
   ```bash
   npm run dev  # Development with auto-reload
   npm start    # Production
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/create-portal-session` - Open customer portal
- `POST /webhook` - Stripe webhook handler

## Local Testing with Webhooks

For local webhook testing, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Use the HTTPS URL in Stripe webhook settings
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONTEND_URL` - Frontend URL for CORS
- `STRIPE_PRICE_ADVANCED` - Price ID for Advanced plan
- `STRIPE_PRICE_EXPERT` - Price ID for Expert plan

## Production Deployment

This server can be deployed to:
- Heroku
- Railway
- Render
- AWS EC2
- Google Cloud Run
- Any Node.js hosting service

Make sure to:
1. Set all environment variables
2. Use HTTPS in production
3. Configure proper CORS settings
4. Set up monitoring/logging