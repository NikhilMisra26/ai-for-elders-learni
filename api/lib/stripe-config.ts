export interface StripePrices {
  advanced: string;
  expert: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  prices: StripePrices;
  webhookSecret: string;
}

type StripeEnvironment = 'test' | 'live';

function getStripeEnvironment(): StripeEnvironment {
  return process.env.STRIPE_ENVIRONMENT === 'live' ? 'live' : 'test';
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export function getStripeConfig(): StripeConfig {
  const env = getStripeEnvironment().toUpperCase();
  return {
    publishableKey: getEnvVar(`VITE_STRIPE_PUBLISHABLE_KEY_${env}`),
    secretKey: getEnvVar(`STRIPE_SECRET_KEY_${env}`),
    prices: {
      advanced: getEnvVar(`VITE_PRICE_ID_ADVANCED_${env}`),
    publishableKey: getEnvVar(`STRIPE_PUBLISHABLE_KEY_${env}`),
    secretKey: getEnvVar(`STRIPE_SECRET_KEY_${env}`),
    prices: {
      advanced: getEnvVar(`PRICE_ID_ADVANCED_${env}`),
      expert: getEnvVar(`PRICE_ID_EXPERT_${env}`),
    },
    webhookSecret: getEnvVar(`STRIPE_WEBHOOK_SECRET_${env}`),
  };
}

export function getPriceId(plan: keyof StripePrices): string {
  const { prices } = getStripeConfig();
  return prices[plan];
}
