import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import {
  checkRateLimit,
  RATE_LIMITS,
  SECURITY_HEADERS,
  validateRequest,
  validatePlan,
  getPriceIdForPlan,
  createSecureResponse,
  sanitizeForLogging,
} from '../lib/security';

// CRITICAL SECURITY: Server-only environment variables (NO VITE_ prefix)
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY_TEST ?? process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const appUrl =
  process.env.APP_URL ?? process.env.VITE_APP_URL ?? 'https://discover50ai.com';

// Security: Validate all required environment variables
if (
  !stripeSecretKey ||
  typeof stripeSecretKey !== 'string' ||
  stripeSecretKey.trim() === ''
) {
  throw new Error(
    'CRITICAL: Stripe secret key is missing. Set STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY',
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL: Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY',
  );
}

// TypeScript assertion after validation
const STRIPE_SECRET_KEY = stripeSecretKey;
const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseAnonKey;
const APP_URL = appUrl;

// Initialize Stripe with latest API version and security settings
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Current stable version in SDK
  typescript: true,
  telemetry: false, // Disable telemetry for security
  maxNetworkRetries: 2,
  timeout: 20000, // 20 second timeout
});

// Initialize Supabase client with anon key (NOT service role)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Type definitions for request validation
type CheckoutPlan = 'advanced' | 'expert';

interface CheckoutSessionRequest {
  plan: CheckoutPlan;
}

// Store for idempotency tracking (in production, use Redis/KV store)
const idempotencyStore = new Map<
  string,
  { timestamp: number; sessionId: string }
>();

// Clean up old idempotency entries (older than 5 minutes)
function cleanupIdempotencyStore(): void {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      idempotencyStore.delete(key);
    }
  }
}

// Generate idempotency key using user ID, plan, and minute bucket
function generateIdempotencyKey(userId: string, plan: string): string {
  const minuteBucket = Math.floor(Date.now() / 60000); // 1-minute buckets
  return `checkout:${userId}:${plan}:${minuteBucket}`;
}

// Extract and validate JWT token from Authorization header
function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  // Ensure we never return undefined to satisfy return type
  return parts[1] ?? null;
}

// Main handler function with comprehensive security
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Clean up old idempotency entries periodically
  cleanupIdempotencyStore();

  try {
    // 1. Enhanced rate limiting with user ID + IP combination
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      'unknown';

    // Initial rate limit check (IP-based for non-authenticated requests)
    const initialRateLimitKey = `ip:${clientIp}`;
    if (!checkRateLimit(initialRateLimitKey, RATE_LIMITS.CHECKOUT)) {
      const response = createSecureResponse(
        { error: 'Too many requests. Please try again later.' },
        429,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res
        .status(429)
        .json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    // 2. Validate request method and content type
    const { valid, error } = validateRequest(req, {
      allowedMethods: ['POST'],
      requireContentType: 'application/json',
      maxBodySize: 10240, // 10KB max body size
    });

    if (!valid) {
      const status = error === 'Method not allowed' ? 405 : 400;
      const response = createSecureResponse(
        {
          error: error ?? 'Invalid request',
          timestamp: new Date().toISOString(),
        },
        status,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(status).json({
        error: error ?? 'Invalid request',
        timestamp,
      });
      return;
    }

    // 3. Extract and validate authentication token
    const token = extractToken(req);
    if (!token) {
      const response = createSecureResponse(
        {
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
        401,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(401).json({
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 4. Verify JWT with Supabase (CRITICAL: Never trust client-provided tokens)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error(
        'Auth verification failed:',
        sanitizeForLogging({
          error: authError?.message,
          timestamp: new Date().toISOString(),
        }),
      );
      const response = createSecureResponse(
        {
          error: 'Invalid or expired authentication token',
          timestamp: new Date().toISOString(),
        },
        401,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(401).json({
        error: 'Invalid or expired authentication token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 5. Enhanced rate limiting with user ID (after authentication)
    const userRateLimitKey = `user:${user.id}:${clientIp}`;
    if (!checkRateLimit(userRateLimitKey, RATE_LIMITS.CHECKOUT)) {
      console.warn(
        'Rate limit exceeded for user:',
        sanitizeForLogging({
          userId: user.id,
          ip: clientIp,
          timestamp: new Date().toISOString(),
        }),
      );
      const response = createSecureResponse(
        {
          error: 'Too many checkout attempts. Please wait before trying again.',
        },
        429,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(429).json({
        error: 'Too many checkout attempts. Please wait before trying again.',
      });
      return;
    }

    // 6. Parse and validate request body
    let body: CheckoutSessionRequest;
    try {
      const rawBody: unknown =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Type guard and validation
      if (!rawBody || typeof rawBody !== 'object' || !('plan' in rawBody)) {
        throw new Error('Invalid request structure');
      }

      body = rawBody as CheckoutSessionRequest;
    } catch {
      const response = createSecureResponse(
        {
          error: 'Invalid request format',
          timestamp: new Date().toISOString(),
        },
        400,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(400).json({
        error: 'Invalid request format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 7. CRITICAL: Validate plan against allowed values (never trust client)
    if (!body.plan || !validatePlan(body.plan)) {
      console.warn(
        'Invalid plan attempted:',
        sanitizeForLogging({
          plan: body.plan,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      );
      const response = createSecureResponse(
        {
          error: 'Invalid subscription plan selected',
          timestamp: new Date().toISOString(),
        },
        400,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(400).json({
        error: 'Invalid subscription plan selected',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 8. Get price ID from secure server-side configuration
    const priceId = getPriceIdForPlan(body.plan);
    if (!priceId) {
      console.error(
        'Price ID not configured for plan:',
        sanitizeForLogging({
          plan: body.plan,
          timestamp: new Date().toISOString(),
        }),
      );
      const response = createSecureResponse(
        {
          error: 'Service temporarily unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        },
        503,
        SECURITY_HEADERS,
      );
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(503).json({
        error: 'Service temporarily unavailable. Please try again later.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 9. Check for existing idempotent request
    const idempotencyKey = generateIdempotencyKey(user.id, body.plan);
    const existingSession = idempotencyStore.get(idempotencyKey);

    if (existingSession && Date.now() - existingSession.timestamp < 60000) {
      // Return existing session if created within last minute
      console.log(
        'Returning existing checkout session:',
        sanitizeForLogging({
          sessionId: existingSession.sessionId,
          userId: user.id,
          plan: body.plan,
          timestamp: new Date().toISOString(),
        }),
      );

      try {
        // Fetch the existing session from Stripe
        const session = await stripe.checkout.sessions.retrieve(
          existingSession.sessionId,
        );

        const response = createSecureResponse(
          {
            success: true,
            url: session.url,
            session_id: session.id,
            timestamp: new Date().toISOString(),
          },
          200,
          SECURITY_HEADERS,
        );
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.status(200).json({
          success: true,
          url: session.url,
          session_id: session.id,
          timestamp: new Date().toISOString(),
        });
        return;
      } catch {
        // Session might have expired, continue to create new one
        idempotencyStore.delete(idempotencyKey);
      }
    }

    // 10. Fetch user profile and check for existing subscriptions
    interface Profile {
      tier: string | null;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
    }

    const profileResult = await supabase
      .from('profiles')
      .select('tier, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    const profile = profileResult.data as Profile | null;

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      console.error(
        'Profile fetch error:',
        sanitizeForLogging({
          error: profileResult.error.message,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    // 11. Prevent duplicate active subscriptions
    if (profile?.tier && profile.tier !== 'free') {
      // Check if they have an active Stripe subscription
      if (profile.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            profile.stripe_subscription_id,
          );
          if (
            subscription.status === 'active' ||
            subscription.status === 'trialing'
          ) {
            const response = createSecureResponse(
              {
                error:
                  'You already have an active subscription. Please manage it from your account settings.',
                timestamp: new Date().toISOString(),
              },
              400,
              SECURITY_HEADERS,
            );
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.status(400).json({
              error:
                'You already have an active subscription. Please manage it from your account settings.',
              timestamp: new Date().toISOString(),
            });
            return;
          }
        } catch (stripeError) {
          console.error(
            'Error checking existing subscription:',
            sanitizeForLogging({
              error:
                stripeError instanceof Error
                  ? stripeError.message
                  : 'Unknown error',
              userId: user.id,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }
    }

    // 12. Create Stripe checkout session with comprehensive security settings
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      customer: profile?.stripe_customer_id ?? undefined,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id, // CRITICAL: Use supabase_user_id for webhook processing
        plan: body.plan,
        email: user.email ?? '',
        environment: STRIPE_SECRET_KEY.includes('test') ? 'test' : 'production',
      },
      success_url: `${APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${APP_URL}/account?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_collection: 'if_required',
      // Security: Expire session after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // Additional security and compliance settings
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: body.plan,
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
      // Fraud prevention
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      // Compliance
      consent_collection: {
        terms_of_service: 'required',
      },
    });

    // 13. Store session in idempotency cache
    idempotencyStore.set(idempotencyKey, {
      timestamp: Date.now(),
      sessionId: session.id,
    });

    // 14. Log checkout session creation (CRITICAL: No sensitive data)
    console.log(
      'Checkout session created:',
      sanitizeForLogging({
        sessionId: session.id,
        userId: user.id,
        plan: body.plan,
        timestamp: new Date().toISOString(),
      }),
    );

    // 15. Return session URL for redirect
    const response = createSecureResponse(
      {
        success: true,
        url: session.url,
        session_id: session.id,
        timestamp: new Date().toISOString(),
      },
      200,
      SECURITY_HEADERS,
    );
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(200).json({
      success: true,
      url: session.url,
      session_id: session.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // CRITICAL: Never expose internal error details to client
    console.error(
      'Checkout session error:',
      sanitizeForLogging({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }),
    );

    // Check for specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      // Rate limit errors
      if (error.type === 'StripeRateLimitError') {
        const response = createSecureResponse(
          {
            error:
              'Service temporarily unavailable due to high demand. Please try again in a few moments.',
            timestamp: new Date().toISOString(),
          },
          503,
          SECURITY_HEADERS,
        );
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.status(503).json({
          error:
            'Service temporarily unavailable due to high demand. Please try again in a few moments.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Invalid request errors (client's fault)
      if (error.type === 'StripeInvalidRequestError') {
        const response = createSecureResponse(
          {
            error:
              'Invalid payment request. Please contact support if this persists.',
            timestamp: new Date().toISOString(),
          },
          400,
          SECURITY_HEADERS,
        );
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.status(400).json({
          error:
            'Invalid payment request. Please contact support if this persists.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Generic error response (no internal details)
    const response = createSecureResponse(
      {
        error:
          'Unable to process payment request at this time. Please try again later.',
        timestamp: new Date().toISOString(),
      },
      500,
      SECURITY_HEADERS,
    );
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(500).json({
      error:
        'Unable to process payment request at this time. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Export config to limit request body size (security measure)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10kb', // Reduced from 1mb for better security
    },
    externalResolver: true,
  },
};
