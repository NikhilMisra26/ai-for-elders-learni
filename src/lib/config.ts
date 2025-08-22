/**
 * Centralized configuration for the application
 * Provides access to environment variables with proper defaults and validation
 */

interface AppConfig {
  api: {
    url: string | undefined;
    isConfigured: boolean;
  };
  supabase: {
    url: string | undefined;
    anonKey: string | undefined;
  };
  analytics: {
    cacheDuration: number;
  };
  environment: {
    isDevelopment: boolean;
    isProduction: boolean;
    mode: string;
  };
}

/**
 * Get the API base URL with validation
 * Returns undefined if not configured, allowing graceful fallback
 */
function getApiUrl(): string | undefined {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    return undefined;
  }

  // Validate URL format
  try {
    new URL(url);
    return url.endsWith('/') ? url.slice(0, -1) : url;
  } catch {
    // Invalid URL format - return undefined for graceful fallback
    return undefined;
  }
}

/**
 * Application configuration object
 */
export const config: AppConfig = {
  api: {
    url: getApiUrl(),
    isConfigured: !!getApiUrl(),
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  analytics: {
    cacheDuration: import.meta.env.VITE_ANALYTICS_CACHE_DURATION_MS
      ? parseInt(import.meta.env.VITE_ANALYTICS_CACHE_DURATION_MS, 10)
      : 5 * 60 * 1000, // 5 minutes default
  },
  environment: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.MODE === 'production',
    mode: import.meta.env.MODE,
  },
} as const;

/**
 * Client-side API rate limiter to prevent excessive requests
 */
class APIRateLimiter {
  private readonly requests: Map<string, number[]> = new Map();

  /**
   * Check if a request should be allowed based on rate limits
   * @param key - Unique identifier for the rate limit (e.g., endpoint, user action)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(key: string, limit = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) ?? [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);

    if (recentRequests.length >= limit) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Clean up old entries periodically (10% of requests)
    // Use deterministic cleanup based on request count
    if (recentRequests.length % 10 === 0) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Throttle a function with rate limiting
   * @param key - Unique identifier for the rate limit
   * @param fn - Async function to throttle
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Promise with the function result or throws if rate limited
   */
  async throttle<T>(key: string, fn: () => Promise<T>, limit = 10, windowMs = 60000): Promise<T> {
    if (!this.checkLimit(key, limit, windowMs)) {
      const waitTime = Math.ceil(windowMs / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
    }

    return await fn();
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string, limit = 10, windowMs = 60000): number {
    const now = Date.now();
    const requests = this.requests.get(key) ?? [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);
    return Math.max(0, limit - recentRequests.length);
  }

  /**
   * Clean up old request records
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // Keep records for 5 minutes

    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => now - t < maxAge);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }
}

// Export singleton instance
export const apiRateLimiter = new APIRateLimiter();

/**
 * Helper function to make API calls with proper error handling and rate limiting
 * @param endpoint - The API endpoint (e.g., '/api/auth/login')
 * @param options - Fetch options
 * @returns Promise with the response or error
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data?: T; error?: string }> {
  if (!config.api.url) {
    return {
      error: 'API not configured. Please check your environment configuration.',
    };
  }

  try {
    // Apply rate limiting for API requests
    return await apiRateLimiter.throttle(
      `api:${endpoint}`,
      async () => {
        const url = `${config.api.url}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            error: errorText || `Request failed with status ${response.status}`,
          };
        }

        const data = (await response.json()) as T;
        return { data };
      },
      20, // 20 requests per minute for general API calls
      60000,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return { error: error.message };
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        error: 'Unable to connect to the API server. Please ensure the server is running.',
      };
    }

    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Check if the API is available
 * @returns Promise<boolean> indicating if the API is reachable
 */
export async function isApiAvailable(): Promise<boolean> {
  if (!config.api.url) {
    return false;
  }

  try {
    const response = await fetch(`${config.api.url}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
