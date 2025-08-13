import { supabase } from './supabase';

export type CheckoutPlan = 'advanced' | 'expert';

interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  session_id?: string;
  error?: string;
  timestamp: string;
}

/**
 * Creates a Stripe checkout session for subscription upgrade
 * @param plan - The subscription plan to purchase ('advanced' or 'expert')
 * @returns The checkout session URL to redirect the user to
 * @throws Error if the request fails or user is not authenticated
 */
export async function createCheckoutSession(
  plan: CheckoutPlan,
): Promise<string> {
  try {
    // Get the current session to obtain the JWT token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Authentication required. Please sign in to continue.');
    }

    // Make the API request to create a checkout session
    const response = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    });

    // Parse the response
    const data = (await response.json()) as CheckoutSessionResponse;

    // Handle errors from the API
    if (!response.ok || !data.success) {
      console.error('Checkout session creation failed:', data.error);
      throw new Error(data.error ?? 'Failed to create checkout session');
    }

    // Validate the response contains a URL
    if (!data.url) {
      throw new Error('Invalid response from payment service');
    }

    return data.url;
  } catch (error) {
    // Log the error for debugging (without sensitive data)
    console.error('Checkout session error:', error);

    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Unable to process payment request. Please try again later.',
    );
  }
}

/**
 * Redirects the user to Stripe Checkout for subscription purchase
 * @param plan - The subscription plan to purchase
 */
export async function redirectToCheckout(plan: CheckoutPlan): Promise<void> {
  try {
    const checkoutUrl = await createCheckoutSession(plan);

    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    // Handle error (could show a toast notification or error dialog)
    console.error('Redirect to checkout failed:', error);
    throw error;
  }
}

/**
 * Validates if a plan string is a valid checkout plan
 * @param plan - The plan string to validate
 * @returns True if the plan is valid
 */
export function isValidCheckoutPlan(plan: string): plan is CheckoutPlan {
  return plan === 'advanced' || plan === 'expert';
}

/**
 * Gets the display information for a subscription plan
 * @param plan - The subscription plan
 * @returns Object containing plan display information
 */
export function getPlanDisplayInfo(plan: CheckoutPlan): {
  name: string;
  price: string;
  description: string;
} {
  const plans = {
    advanced: {
      name: 'Advanced',
      price: '$1.99/month',
      description: 'Access to advanced AI courses and features',
    },
    expert: {
      name: 'Expert',
      price: '$4.99/month',
      description:
        'Full access to all courses, priority support, and exclusive content',
    },
  };

  return plans[plan];
}
