interface StripePrices {
  advanced?: string;
  expert?: string;
}

interface StripeConfig {
  publishableKey?: string;
  prices?: StripePrices;
}

type Env = Record<string, string | undefined>;

const metaEnv: Env =
  typeof import.meta !== 'undefined' ? (import.meta.env as Env) : ({} as Env);

const env: Env = { ...process.env, ...metaEnv } as Env;
const isLive = env.VITE_STRIPE_ENVIRONMENT === 'live';

export const stripeConfig: StripeConfig = {
  publishableKey: isLive
    ? env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE
    : env.VITE_STRIPE_PUBLISHABLE_KEY_TEST,
  prices: {
    advanced: isLive
      ? env.VITE_PRICE_ID_ADVANCED_LIVE
      : env.VITE_PRICE_ID_ADVANCED_TEST,
    expert: isLive
      ? env.VITE_PRICE_ID_EXPERT_LIVE
      : env.VITE_PRICE_ID_EXPERT_TEST,
  },
};

export const stripeSecretKey = isLive
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

export const webhookSecret = isLive
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;
