import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { errorHandler } from './errorHandler';
import { supabase } from './supabaseClient';

// Type-safe environment variable access
const getEnvVar = (key: string): string | undefined => {
  // Properly type the env object
  const env = import.meta.env as Record<string, string | undefined>;
  return env[key];
};

// Backend API URL - update for production
const API_URL = getEnvVar('VITE_API_URL') ?? 'http://localhost:3001';

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY');
    if (!key) {
      console.error('Stripe publishable key not found');
      if (import.meta.env.MODE === 'production') {
        errorHandler.handlePaymentError(
          'initialize stripe',
          new Error('Stripe publishable key not configured'),
          {},
        );
      }
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export interface StripePrice {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
}

// Helper function to get properly configured price ID
export function getStripePriceId(
  planId: 'advanced' | 'expert',
  interval: 'monthly' = 'monthly',
): string {
  const priceId = STRIPE_PRICES[planId][interval];

  // Warn in development if using placeholder
  if (
    import.meta.env.MODE === 'development' &&
    typeof priceId === 'string' &&
    priceId.includes('placeholder')
  ) {
    console.warn(
      `Using placeholder price ID for ${planId} ${interval}. Configure VITE_STRIPE_PRICE_${planId.toUpperCase()}_MONTHLY in .env.local`,
    );
  }

  return priceId;
}

// Helper function to validate Stripe configuration
export function isStripeConfigured(): boolean {
  const hasKeys =
    !!getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY') &&
    !!getEnvVar('VITE_STRIPE_PRICE_ADVANCED_MONTHLY') &&
    !!getEnvVar('VITE_STRIPE_PRICE_EXPERT_MONTHLY');

  const notPlaceholders =
    typeof STRIPE_PRICES.advanced.priceId === 'string' &&
    !STRIPE_PRICES.advanced.priceId.includes('placeholder') &&
    typeof STRIPE_PRICES.expert.priceId === 'string' &&
    !STRIPE_PRICES.expert.priceId.includes('placeholder');

  return hasKeys && notPlaceholders;
}

// Configuration validation
const validateStripeConfig = (): void => {
  const required = [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_STRIPE_PRICE_ADVANCED_MONTHLY',
    'VITE_STRIPE_PRICE_EXPERT_MONTHLY',
  ];

  const missing = required.filter((key) => !getEnvVar(key));

  if (missing.length > 0) {
    console.error('Missing required Stripe configuration:', missing.join(', '));
    if (import.meta.env.MODE === 'production') {
      throw new Error(
        `Missing required Stripe configuration: ${missing.join(', ')}`,
      );
    }
  }
};

// Validate configuration on module load
if (import.meta.env.MODE !== 'test') {
  validateStripeConfig();
}

// Price IDs for subscription plans (configured via environment variables)
export const STRIPE_PRICES = {
  advanced: {
    monthly:
      getEnvVar('VITE_STRIPE_PRICE_ADVANCED_MONTHLY') ??
      (import.meta.env.MODE === 'production'
        ? ((): string => {
            throw new Error(
              'VITE_STRIPE_PRICE_ADVANCED_MONTHLY is required in production',
            );
          })()
        : 'price_placeholder_advanced'),
    priceId:
      getEnvVar('VITE_STRIPE_PRICE_ADVANCED_MONTHLY') ??
      (import.meta.env.MODE === 'production'
        ? ((): string => {
            throw new Error(
              'VITE_STRIPE_PRICE_ADVANCED_MONTHLY is required in production',
            );
          })()
        : 'price_placeholder_advanced'),
    amount: parseInt(
      getEnvVar('VITE_STRIPE_AMOUNT_ADVANCED_MONTHLY') ?? '199',
      10,
    ), // in cents, defaults to $1.99
  },
  expert: {
    monthly:
      getEnvVar('VITE_STRIPE_PRICE_EXPERT_MONTHLY') ??
      (import.meta.env.MODE === 'production'
        ? ((): string => {
            throw new Error(
              'VITE_STRIPE_PRICE_EXPERT_MONTHLY is required in production',
            );
          })()
        : 'price_placeholder_expert'),
    priceId:
      getEnvVar('VITE_STRIPE_PRICE_EXPERT_MONTHLY') ??
      (import.meta.env.MODE === 'production'
        ? ((): string => {
            throw new Error(
              'VITE_STRIPE_PRICE_EXPERT_MONTHLY is required in production',
            );
          })()
        : 'price_placeholder_expert'),
    amount: parseInt(
      getEnvVar('VITE_STRIPE_AMOUNT_EXPERT_MONTHLY') ?? '499',
      10,
    ), // in cents, defaults to $4.99
  },
} as const;

/**
 * Create a Stripe Checkout session for subscription
 * This will call a Supabase Edge Function to create the session server-side
 */
export async function createCheckoutSession(
  planId: 'advanced' | 'expert',
): Promise<{ sessionId?: string; error?: string }> {
  try {
    const priceId = STRIPE_PRICES[planId].priceId;

    // Validate price ID is not a placeholder in production
    if (
      import.meta.env.MODE === 'production' &&
      typeof priceId === 'string' &&
      priceId.includes('placeholder')
    ) {
      errorHandler.handlePaymentError(
        'create checkout session',
        new Error('Invalid Stripe price configuration'),
        {
          metadata: { planId, priceId },
        },
      );
      return { error: 'Payment configuration error. Please contact support.' };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { error: 'Authentication required' };
    }

    // Call backend API to create checkout session
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      const errorMessage = error.error ?? 'Failed to create checkout session';
      errorHandler.handlePaymentError(
        'create checkout session',
        new Error(errorMessage),
        {
          metadata: { planId, priceId },
        },
      );
      return { error: errorMessage };
    }

    const data = (await response.json()) as { sessionId: string };
    return { sessionId: data.sessionId };
  } catch (error) {
    errorHandler.handlePaymentError(
      'create checkout session',
      error instanceof Error ? error : new Error(String(error)),
      {
        metadata: { planId },
      },
    );
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(
  sessionId: string,
): Promise<{ error?: string }> {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      return { error: 'Stripe not initialized' };
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      errorHandler.handlePaymentError(
        'redirect to checkout',
        new Error(error.message),
        {
          metadata: { sessionId },
        },
      );
      return { error: error.message };
    }

    return {};
  } catch (error) {
    errorHandler.handlePaymentError(
      'redirect to checkout',
      error instanceof Error ? error : new Error(String(error)),
      {
        metadata: { sessionId },
      },
    );
    return { error: 'Failed to redirect to checkout' };
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createPortalSession(): Promise<{
  url?: string;
  error?: string;
}> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { error: 'Authentication required' };
    }

    // Call backend API to create portal session
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      const errorMessage = error.error ?? 'Failed to create portal session';
      errorHandler.handlePaymentError(
        'create portal session',
        new Error(errorMessage),
        {},
      );
      return { error: errorMessage };
    }

    const data = (await response.json()) as { url: string };
    return { url: data.url };
  } catch (error) {
    errorHandler.handlePaymentError(
      'create portal session',
      error instanceof Error ? error : new Error(String(error)),
      {},
    );
    return { error: 'Failed to create portal session' };
  }
}

/**
 * Handle successful payment return
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    // The webhook will handle verification and updates
    // This is just for client-side confirmation
    console.log('Payment successful, session:', sessionId);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
