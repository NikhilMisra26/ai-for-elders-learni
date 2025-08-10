# AI for Elders - Backend Server

This is the Node.js/Express backend server that handles Stripe payment processing for the AI for Elders platform.

## Features

- Stripe checkout session creation
- Stripe customer portal management
- Webhook handling for automatic subscription updates
- Database synchronization with Supabase
- **Security measures:**
  - Rate limiting to prevent abuse
  - Request body size limits
  - Helmet security headers
  - Enhanced CORS configuration
  - Input validation and sanitization
  - Environment validation on startup

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

## Security Features

The server includes multiple layers of security protection:

### Rate Limiting
- **General requests**: 100 requests per 15 minutes per IP
- **API endpoints**: 10 requests per 15 minutes per IP
- **Webhook endpoint**: 1000 requests per 15 minutes per IP (higher limit for Stripe)

### Request Protection
- **Body size limits**: 10KB for API endpoints, 1MB for webhooks
- **Content type validation**: Strict JSON parsing
- **Input sanitization**: Email normalization, UUID validation

### Headers & CORS
- **Helmet security headers**: XSS protection, content security policy
- **CORS whitelist**: Only allowed origins can make requests
- **Trusted proxy**: Proper IP detection behind reverse proxies

### Environment Security
- **Startup validation**: All required environment variables checked
- **Graceful shutdown**: Proper cleanup on termination signals
- **Error handling**: Sanitized error messages in production

### Monitoring
- **Request logging**: All security events are logged
- **Error tracking**: Global error handler with detailed logging
- **Health checks**: Simple endpoint for uptime monitoring