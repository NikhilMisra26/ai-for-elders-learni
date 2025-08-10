import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { errorHandler } from './errorHandler';

// Backend API URL - update for production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Stripe publishable key not found');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripePrice {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
}

// Price IDs for subscription plans (you'll need to create these in Stripe Dashboard)
export const STRIPE_PRICES = {
  advanced: {
    monthly: 'price_advanced_monthly', // $1.99/month
    priceId: 'price_advanced_monthly',
    amount: 199, // in cents
  },
  expert: {
    monthly: 'price_expert_monthly', // $4.99/month
    priceId: 'price_expert_monthly',
    amount: 499, // in cents
  },
};

/**
 * Create a Stripe Checkout session for subscription
 * This will call a Supabase Edge Function to create the session server-side
 */
export async function createCheckoutSession(
  planId: 'advanced' | 'expert',
  userId: string,
  userEmail: string,
): Promise<{ sessionId?: string; error?: string }> {
  try {
    const priceId = STRIPE_PRICES[planId].priceId;

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          priceId,
          userId,
          userEmail,
          successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/account`,
          mode: 'subscription',
          metadata: {
            userId,
            planId,
          },
        },
      },
    );

    if (error) {
      errorHandler.handlePaymentError(
        'create checkout session',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId,
          metadata: { planId, priceId },
        },
      );
      return { error: error.message || 'Failed to create checkout session' };
    }

    return { sessionId: data?.sessionId };
  } catch (error) {
    errorHandler.handlePaymentError(
      'create checkout session',
      error instanceof Error ? error : new Error(String(error)),
      {
        userId,
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
export async function createPortalSession(
  userId: string,
): Promise<{ url?: string; error?: string }> {
  try {
    // Call Supabase Edge Function to create portal session
    const { data, error } = await supabase.functions.invoke(
      'create-portal-session',
      {
        body: {
          userId,
          returnUrl: `${window.location.origin}/account`,
        },
      },
    );

    if (error) {
      errorHandler.handlePaymentError(
        'create portal session',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId,
        },
      );
      return { error: error.message || 'Failed to create portal session' };
    }

    return { url: data?.url };
  } catch (error) {
    errorHandler.handlePaymentError(
      'create portal session',
      error instanceof Error ? error : new Error(String(error)),
      {
        userId,
      },
    );
    return { error: 'Failed to create portal session' };
  }
}

/**
 * Handle successful payment return
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    // Verify the session with backend
    const { error } = await supabase.functions.invoke(
      'verify-checkout-session',
      {
        body: { sessionId },
      },
    );

    if (error) {
      console.error('Failed to verify payment session:', error);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Get subscription status from Stripe
 */
export async function getSubscriptionStatus(userId: string): Promise<{
  active: boolean;
  planId?: 'advanced' | 'expert';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'get-subscription-status',
      {
        body: { userId },
      },
    );

    if (error) {
      return { active: false, error: error.message };
    }

    return {
      active: data?.active || false,
      planId: data?.planId,
      currentPeriodEnd: data?.currentPeriodEnd,
      cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { active: false, error: 'Failed to get subscription status' };
  }
}
