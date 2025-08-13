import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import { stripeConfig, stripeSecretKey } from '../../src/lib/stripe-config';

// Security: Use environment variables for all sensitive data
const stripe = new Stripe(stripeSecretKey ?? '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for request validation
type CheckoutPlan = keyof typeof stripeConfig.prices;

interface CheckoutSessionRequest {
  plan: CheckoutPlan;
}

// Security headers for all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'",
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Helper function to send error response with security headers
const sendError = (
  res: VercelResponse,
  statusCode: number,
  message: string,
): VercelResponse => {
  // Set security headers individually
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to send success response with security headers
const sendSuccess = (
  res: VercelResponse,
  data: Record<string, unknown>,
): VercelResponse => {
  // Set security headers individually
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(200).json({
    success: true,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Validate request method
const validateMethod = (req: VercelRequest, res: VercelResponse): boolean => {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return false;
  }
  return true;
};

// Extract and validate JWT token from Authorization header
const extractToken = (req: VercelRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Validate the plan parameter
const validatePlan = (plan: unknown): plan is CheckoutPlan => {
  return typeof plan === 'string' && plan in stripeConfig.prices;
};

// Map plan to Stripe price ID from configuration
const getPriceId = (plan: CheckoutPlan): string | undefined => {
  return stripeConfig.prices[plan];
};

// Main handler function
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  try {
    // 1. Validate HTTP method (only POST allowed)
    if (!validateMethod(req, res)) {
      return res;
    }

    // 2. Extract and validate JWT token
    const token = extractToken(req);
    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    // 3. Verify JWT with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError?.message);
      return sendError(res, 401, 'Invalid authentication token');
    }

    // 4. Parse and validate request body
    let body: CheckoutSessionRequest;
    try {
      body =
        typeof req.body === 'string'
          ? (JSON.parse(req.body) as CheckoutSessionRequest)
          : (req.body as CheckoutSessionRequest);
    } catch {
      return sendError(res, 400, 'Invalid request format');
    }

    // 5. Validate plan parameter
    if (!body.plan || !validatePlan(body.plan)) {
      return sendError(res, 400, 'Invalid subscription plan');
    }

    // 6. Get price ID for the selected plan
    const priceId = getPriceId(body.plan);
    if (!priceId) {
      console.error('Price ID not configured for plan:', body.plan);
      return sendError(res, 500, 'Service temporarily unavailable');
    }

    // 7. Get user's current subscription status to prevent duplicate subscriptions
    interface Profile {
      tier: string | null;
      stripe_customer_id: string | null;
    }

    const profileResult = await supabase
      .from<Profile>('profiles')
      .select('tier, stripe_customer_id')
      .eq('id', user.id)
      .single();
    const profile = profileResult.data as Profile | null;
    const profileError = profileResult.error;

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      // Continue without profile data - not a blocking error
    }

    // 8. Check if user already has an active subscription
    if (profile?.tier && profile.tier !== 'free') {
      return sendError(res, 400, 'Active subscription already exists');
    }

    // 9. Create Stripe checkout session
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
        user_id: user.id,
        plan: body.plan,
        email: user.email ?? '',
      },
      success_url: `${req.headers.origin ?? process.env.VITE_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin ?? process.env.VITE_APP_URL}/account?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_collection: 'if_required',
      // Security: Expire session after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // Additional security settings
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: body.plan,
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
    });

    // 10. Log checkout session creation (without sensitive data)
    console.log('Checkout session created:', {
      session_id: session.id,
      user_id: user.id,
      plan: body.plan,
      timestamp: new Date().toISOString(),
    });

    // 11. Return session URL for redirect
    return sendSuccess(res, {
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    // Log error securely (no sensitive data in logs)
    console.error('Checkout session error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // Return generic error message to prevent information leakage
    return sendError(res, 500, 'Unable to process request at this time');
  }
}

// Export config to limit request body size (security measure)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true,
  },
};
