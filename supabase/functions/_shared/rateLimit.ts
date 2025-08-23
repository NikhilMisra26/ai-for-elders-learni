/**
 * Rate limiting middleware for Supabase Edge Functions
 * Uses Upstash Redis for distributed rate limiting across edge locations
 */

// Type definitions for Upstash Redis client
interface UpstashRedisConfig {
  url: string;
  token: string;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
  keyPrefix?: string; // Prefix for Redis keys
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
  retryAfter?: number; // Seconds until next request is allowed
}

/**
 * Simple Upstash Redis client for Deno
 * Uses REST API instead of TCP connection for edge compatibility
 */
class UpstashRedis {
  private url: string;
  private headers: Headers;

  constructor(config: UpstashRedisConfig) {
    this.url = config.url;
    this.headers = new Headers({
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    });
  }

  async incr(key: string): Promise<number> {
    const response = await fetch(`${this.url}/incr/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Redis INCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const response = await fetch(`${this.url}/expire/${encodeURIComponent(key)}/${seconds}`, {
      method: 'POST',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Redis EXPIRE failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result === 1;
  }

  async ttl(key: string): Promise<number> {
    const response = await fetch(`${this.url}/ttl/${encodeURIComponent(key)}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Redis TTL failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }

  async del(key: string): Promise<number> {
    const response = await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Redis DEL failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }
}

/**
 * Rate limiter class using sliding window algorithm
 */
export class RateLimiter {
  private redis: UpstashRedis | null = null;
  private config: RateLimitConfig;
  private fallbackStore: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'rate_limit:',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Initialize Redis if credentials are available
    // Check for Deno environment with proper type safety
    const redisUrl =
      'Deno' in globalThis
        ? (globalThis as typeof globalThis & { Deno: typeof Deno }).Deno.env.get(
            'UPSTASH_REDIS_URL',
          )
        : undefined;
    const redisToken =
      'Deno' in globalThis
        ? (globalThis as typeof globalThis & { Deno: typeof Deno }).Deno.env.get(
            'UPSTASH_REDIS_TOKEN',
          )
        : undefined;

    if (redisUrl && redisToken) {
      this.redis = new UpstashRedis({ url: redisUrl, token: redisToken });
    } else {
      console.warn(
        'Upstash Redis credentials not found. Using in-memory rate limiting (not distributed).',
      );
    }
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const resetAt = now + this.config.windowMs;

    try {
      if (this.redis) {
        // Use Redis for distributed rate limiting
        return await this.checkRedisLimit(key, resetAt);
      } else {
        // Fall back to in-memory rate limiting
        return this.checkMemoryLimit(key, now, resetAt);
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: resetAt,
      };
    }
  }

  private async checkRedisLimit(key: string, resetAt: number): Promise<RateLimitResult> {
    // Increment the counter
    const count = await this.redis!.incr(key);

    // Set expiry on first request in the window
    if (count === 1) {
      await this.redis!.expire(key, Math.ceil(this.config.windowMs / 1000));
    }

    // Get TTL for accurate reset time
    const ttl = await this.redis!.ttl(key);
    const actualResetAt = ttl > 0 ? Date.now() + ttl * 1000 : resetAt;

    const remaining = Math.max(0, this.config.maxRequests - count);
    const success = count <= this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      reset: actualResetAt,
      retryAfter: success ? undefined : Math.ceil(ttl),
    };
  }

  private checkMemoryLimit(key: string, now: number, resetAt: number): RateLimitResult {
    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    let entry = this.fallbackStore.get(key);

    if (!entry || entry.resetAt <= now) {
      // Create new entry
      entry = { count: 1, resetAt };
      this.fallbackStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const success = entry.count <= this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      reset: entry.resetAt,
      retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  private cleanupExpiredEntries(now: number): void {
    // Prevent memory leak by cleaning up old entries
    if (this.fallbackStore.size > 1000) {
      const entriesToDelete: string[] = [];
      for (const [key, entry] of this.fallbackStore.entries()) {
        if (entry.resetAt <= now) {
          entriesToDelete.push(key);
        }
      }
      entriesToDelete.forEach((key) => this.fallbackStore.delete(key));
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}${identifier}`;

    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.fallbackStore.delete(key);
    }
  }
}

/**
 * Extract client IP from request headers
 * Checks common proxy headers in order of preference
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check proxy headers in order of reliability
  const proxyHeaders = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx proxy
    'x-forwarded-for', // Standard proxy header
    'x-client-ip', // Some proxies
    'true-client-ip', // Cloudflare Enterprise
    'x-cluster-client-ip', // Some load balancers
  ];

  for (const header of proxyHeaders) {
    const value = headers.get(header);
    if (value) {
      // For x-forwarded-for, take the first IP (original client)
      if (header === 'x-forwarded-for') {
        return value.split(',')[0].trim();
      }
      return value.trim();
    }
  }

  // Fallback to a default if no IP found
  // In Supabase Edge Functions, there's no direct socket access
  return 'unknown';
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();

  // Standard rate limit headers (RFC 6585)
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));

  if (result.retryAfter !== undefined) {
    headers.set('Retry-After', String(result.retryAfter));
  }

  return headers;
}

/**
 * Convenience function to apply rate limiting to a request
 */
export async function applyRateLimit(
  request: Request,
  limiter: RateLimiter,
  options?: {
    identifierType?: 'ip' | 'user' | 'custom';
    customIdentifier?: string;
    userId?: string;
  },
): Promise<{ allowed: boolean; headers: Headers; message?: string }> {
  let identifier: string;

  switch (options?.identifierType) {
    case 'user':
      identifier = options.userId || 'anonymous';
      break;
    case 'custom':
      identifier = options.customIdentifier || 'unknown';
      break;
    case 'ip':
    default:
      identifier = getClientIp(request);
      break;
  }

  const result = await limiter.checkLimit(identifier);
  const headers = createRateLimitHeaders(result);

  if (!result.success) {
    const message = `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`;
    return { allowed: false, headers, message };
  }

  return { allowed: true, headers };
}
