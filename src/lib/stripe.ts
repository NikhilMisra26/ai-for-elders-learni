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

    // Call backend API to create checkout session
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        planId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      errorHandler.handlePaymentError(
        'create checkout session',
        new Error(error.error || 'Failed to create checkout session'),
        {
          userId,
          metadata: { planId, priceId },
        },
      );
      return { error: error.error || 'Failed to create checkout session' };
    }

    const data = await response.json();
    return { sessionId: data.sessionId };
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
    // Call backend API to create portal session
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      errorHandler.handlePaymentError(
        'create portal session',
        new Error(error.error || 'Failed to create portal session'),
        {
          userId,
        },
      );
      return { error: error.error || 'Failed to create portal session' };
    }

    const data = await response.json();
    return { url: data.url };
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
    // The webhook will handle verification and updates
    // This is just for client-side confirmation
    console.log('Payment successful, session:', sessionId);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
