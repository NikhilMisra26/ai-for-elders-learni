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
    if (import.meta.env.DEV) {
      console.warn('Invalid VITE_API_URL format:', url);
    }
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
 * Helper function to make API calls with proper error handling
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

    const data = await response.json();
    return { data };
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.includes('Failed to fetch')
    ) {
      return {
        error:
          'Unable to connect to the API server. Please ensure the server is running.',
      };
    }

    return {
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
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
