# Environment Variables Configuration

This document outlines the environment variables that can be configured to customize the behavior of the AI for Elders application. All hardcoded values have been moved to environment variables for better security and configurability.

## Server-Side Configuration (server/.env)

### Required Variables
These variables are required for the server to function:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret  
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `FRONTEND_URL`: Your frontend URL for CORS
- `STRIPE_PRICE_ADVANCED`: Stripe price ID for advanced plan
- `STRIPE_PRICE_EXPERT`: Stripe price ID for expert plan

### Optional Server Configuration
These have sensible defaults but can be customized:

#### Basic Configuration
- `PORT` (default: 3001): Server port
- `NODE_ENV` (default: development): Environment mode
- `STRIPE_API_VERSION` (default: 2023-10-16): Stripe API version to use

#### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` (default: 900000): Rate limit window in milliseconds (15 minutes)
- `RATE_LIMIT_GENERAL_MAX` (default: 100): Max general requests per window
- `RATE_LIMIT_API_MAX` (default: 10): Max API requests per window
- `RATE_LIMIT_WEBHOOK_MAX` (default: 1000): Max webhook requests per window

#### Request Body Limits
- `WEBHOOK_BODY_LIMIT` (default: 1mb): Maximum size for webhook payloads
- `API_BODY_LIMIT` (default: 10kb): Maximum size for API request bodies
- `URLENCODED_BODY_LIMIT` (default: 10kb): Maximum size for URL-encoded bodies

#### CORS Configuration
- `DEV_CORS_ORIGIN_1` (default: http://localhost:5173): Development CORS origin 1
- `DEV_CORS_ORIGIN_2` (default: https://localhost:5173): Development CORS origin 2

#### Business Logic
- `GRACE_PERIOD_DAYS` (default: 7): Payment failure grace period in days
- `ANALYTICS_CACHE_DURATION_MS` (default: 300000): Analytics cache duration (5 minutes)

## Client-Side Configuration (.env.local)

### Required Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `VITE_STRIPE_PRICE_ADVANCED_MONTHLY`: Stripe price ID for advanced plan
- `VITE_STRIPE_PRICE_EXPERT_MONTHLY`: Stripe price ID for expert plan

### Optional Client Configuration

#### API Configuration
- `VITE_API_URL` (default: http://localhost:3001): Backend API URL
- `VITE_STRIPE_AMOUNT_ADVANCED_MONTHLY` (default: 199): Advanced plan price in cents
- `VITE_STRIPE_AMOUNT_EXPERT_MONTHLY` (default: 499): Expert plan price in cents

#### Security Settings (Senior-Friendly Defaults)
- `VITE_MAX_LOGIN_ATTEMPTS` (default: 5): Maximum failed login attempts
- `VITE_LOCKOUT_DURATION_MINUTES` (default: 15): Account lockout duration
- `VITE_PASSWORD_MIN_LENGTH` (default: 8): Minimum password length
- `VITE_PASSWORD_REQUIRE_SPECIAL_CHAR` (default: true): Require special characters
- `VITE_PASSWORD_REQUIRE_NUMBER` (default: true): Require numbers in passwords
- `VITE_SESSION_TIMEOUT_MINUTES` (default: 60): Session timeout (senior-friendly)

#### Performance Settings
- `VITE_ANALYTICS_CACHE_DURATION_MS` (default: 300000): Analytics cache duration (5 minutes)

## Migration Summary

The following hardcoded values have been moved to environment variables:

### Server Changes
1. **Rate Limiting**: Window duration and max request counts are now configurable
2. **Request Body Limits**: All size limits can be customized via environment variables
3. **Stripe Configuration**: API version is now configurable
4. **CORS Origins**: Development origins are now configurable
5. **Grace Period**: Payment failure grace period is now configurable
6. **Analytics Cache**: Cache duration is configurable

### Client Changes
1. **Security Configuration**: All password and session security settings are configurable
2. **Analytics Cache**: Client-side cache duration is configurable

## Benefits

1. **Security**: Sensitive configuration is no longer hardcoded
2. **Flexibility**: Easy to adjust rate limits, timeouts, and other parameters per environment
3. **Deployment**: Different configurations for development, staging, and production
4. **Maintenance**: No code changes needed to adjust operational parameters

## Backward Compatibility

All changes are backward compatible. If environment variables are not set, the application will use the same default values that were previously hardcoded.