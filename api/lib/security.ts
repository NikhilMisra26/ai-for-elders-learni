import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Security utilities for Stripe payment integration
 * CRITICAL: These functions handle payment security - review all changes carefully
 */

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Token bucket rate limiter
 * Prevents abuse of payment endpoints
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit checker using token bucket algorithm
 * @param key - Unique identifier (user ID, IP, etc.)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetTime) {
    // Create new bucket or reset expired bucket
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (bucket.count >= config.maxRequests) {
    return false; // Rate limited
  }

  bucket.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, bucket] of entries) {
    if (now > bucket.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Security headers for all API responses
 * Prevents common attacks like XSS, clickjacking, etc.
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' js.stripe.com; style-src 'self' 'unsafe-inline'; connect-src 'self' api.stripe.com *.supabase.co; frame-src js.stripe.com",
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
} as const;

/**
 * Validate request basics (method, content-type, size)
 */
export interface RequestValidationOptions {
  allowedMethods: string[];
  requireContentType?: string;
  maxBodySize?: number;
}

export function validateRequest(
  request: VercelRequest,
  options: RequestValidationOptions,
): { valid: boolean; error?: string } {
  // Check method
  if (!options.allowedMethods.includes(request.method ?? '')) {
    return { valid: false, error: 'Method not allowed' };
  }

  // Check content type if required
  if (options.requireContentType && request.method !== 'GET') {
    const contentType = request.headers?.['content-type'];
    if (!contentType?.includes(options.requireContentType)) {
      return { valid: false, error: 'Invalid content type' };
    }
  }

  // Check body size (Vercel has 1MB limit by default)
  if (options.maxBodySize) {
    const contentLength = request.headers?.['content-length'];
    if (contentLength && parseInt(contentLength) > options.maxBodySize) {
      return { valid: false, error: 'Request too large' };
    }
  }

  return { valid: true };
}

/**
 * Supabase user data from JWT validation
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  aud?: string;
  role?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  identities?: unknown[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Extract and validate Supabase JWT from Authorization header
 */
export async function validateSupabaseAuth(request: VercelRequest): Promise<{
  valid: boolean;
  user?: SupabaseUser;
  error?: string;
}> {
  try {
    const authHeader = request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.slice(7);
    if (!token) {
      return { valid: false, error: 'Missing access token' };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { valid: false, error: 'Supabase configuration missing' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, user: user as unknown as SupabaseUser };
  } catch {
    return { valid: false, error: 'Authentication failed' };
  }
}

/**
 * Verify Stripe webhook signature
 * CRITICAL: This prevents webhook spoofing attacks
 */
export function verifyStripeSignature(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string,
): boolean {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY_TEST;
    if (!stripeKey) {
      console.error('Stripe secret key not configured');
      return false;
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // This will throw if signature is invalid
    stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    return true;
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return false;
  }
}

/**
 * Type for data that can be sanitized for logging
 */
export type LoggableData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined;

/**
 * Sanitize data for logging
 * Removes sensitive information that should never be logged
 */
export function sanitizeForLogging(data: LoggableData): LoggableData {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    // Cast each array element to LoggableData for recursive sanitization
    return (data as unknown[]).map((item) => sanitizeForLogging(item as LoggableData));
  }

  const sensitiveKeys = [
    'password',
    'secret',
    'key',
    'token',
    'authorization',
    'stripe_secret',
    'service_role',
    'private_key',
    'client_secret',
    'card',
    'payment_method',
    'source',
    'cvv',
    'cvc',
  ];

  // Type guard to ensure we're working with a record
  const record = data;
  const sanitized: Record<string, unknown> = { ...record };

  for (const key in sanitized) {
    if (
      sensitiveKeys.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase()),
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key] as LoggableData);
    }
  }

  return sanitized;
}

/**
 * Create safe error response that doesn't leak internal information
 */
export function createSafeErrorResponse(
  error: LoggableData,
  defaultMessage = 'An error occurred',
): { error: string } {
  // Log the actual error for debugging (sanitized)
  console.error('API Error:', sanitizeForLogging(error));

  // Return generic message to client
  return { error: defaultMessage };
}

/**
 * Validate plan parameter against allowed values
 */
export function validatePlan(plan: unknown): plan is 'advanced' | 'expert' {
  return typeof plan === 'string' && ['advanced', 'expert'].includes(plan);
}

/**
 * Get price ID for plan from environment variables
 */
export function getPriceIdForPlan(plan: 'advanced' | 'expert'): string | null {
  const priceId =
    plan === 'advanced'
      ? process.env.PRICE_ID_ADVANCED_TEST
      : process.env.PRICE_ID_EXPERT_TEST;

  return priceId ?? null;
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Create standardized API response with security headers
 */
export function createSecureResponse(
  data: unknown,
  status = 200,
  additionalHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...additionalHeaders,
  });

  applySecurityHeaders(headers);

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMITS = {
  CHECKOUT: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  PORTAL: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  WEBHOOK: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
} as const;

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
