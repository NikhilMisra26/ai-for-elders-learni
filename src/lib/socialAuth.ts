import type { Provider } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';
import { SecurityLogger } from '@/lib/security';

export type OAuthProvider = 'google' | 'facebook';

interface OAuthConfig {
  provider: Provider;
  scopes?: string | undefined;
  queryParams?: Record<string, string>;
  skipBrowserRedirect?: boolean;
}

interface OAuthResult {
  success: boolean;
  error?: string;
  url?: string;
}

// OAuth provider configurations
const providerConfigs: Record<OAuthProvider, OAuthConfig> = {
  google: {
    provider: 'google',
    queryParams: {
      access_type: 'online',
      prompt: 'select_account',
    },
  },
  facebook: {
    provider: 'facebook',
    scopes: 'email public_profile',
  },
};

// Generate a secure random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Validate OAuth callback parameters
export function validateOAuthCallback(searchParams: URLSearchParams): {
  isValid: boolean;
  error?: string;
  code?: string;
  state?: string;
} {
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Check for OAuth errors
  if (error) {
    let userFriendlyError = 'Authentication failed';

    // Handle common OAuth errors
    switch (error) {
      case 'access_denied':
        userFriendlyError = 'Access was denied. Please try again.';
        break;
      case 'temporarily_unavailable':
        userFriendlyError = 'The service is temporarily unavailable. Please try again later.';
        break;
      case 'invalid_request':
        userFriendlyError = 'Invalid request. Please try signing in again.';
        break;
      default:
        userFriendlyError = errorDescription ?? 'Authentication failed. Please try again.';
    }

    // Log security event
    SecurityLogger.logSecurityEvent('oauth_error', {
      provider: 'unknown',
      error,
      errorDescription,
    });

    return {
      isValid: false,
      error: userFriendlyError,
    };
  }

  // Validate required parameters
  if (!code) {
    return {
      isValid: false,
      error: 'No authorization code received',
    };
  }

  return {
    isValid: true,
    code,
    state,
  };
}

// Initiate OAuth sign-in flow
export async function signInWithOAuth(provider: OAuthProvider): Promise<OAuthResult> {
  try {
    const config = providerConfigs[provider];
    if (!config) {
      return {
        success: false,
        error: 'Invalid OAuth provider',
      };
    }

    // Log the authentication attempt
    SecurityLogger.logSecurityEvent('oauth_attempt', {
      provider,
      timestamp: new Date().toISOString(),
    });

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in sessionStorage for validation on callback
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('oauth_state', state);
      window.sessionStorage.setItem('oauth_provider', provider);
    }

    // Get the current URL for redirect
    const redirectTo = `${window.location.origin}/auth/callback`;

    // Initiate OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: config.provider,
      options: {
        redirectTo,
        scopes: config.scopes,
        queryParams: config.queryParams,
        skipBrowserRedirect: config.skipBrowserRedirect,
      },
    });

    if (error) {
      errorHandler.handleAuthError(`oauth_${provider}`, error, {
        metadata: { provider },
      });

      return {
        success: false,
        error: error.message || `Failed to sign in with ${provider}`,
      };
    }

    if (data?.url) {
      // Log successful OAuth initiation
      SecurityLogger.logSecurityEvent('oauth_initiated', {
        provider,
        hasUrl: true,
      });

      // If skipBrowserRedirect is true, return the URL for manual handling
      if (config.skipBrowserRedirect) {
        return {
          success: true,
          url: data.url,
        };
      }

      // Otherwise, the browser will automatically redirect
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: 'No authentication URL received',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errorHandler.handleAuthError(
      `oauth_${provider}_error`,
      error instanceof Error ? error : new Error(errorMessage),
      {
        metadata: { provider },
      },
    );

    return {
      success: false,
      error: `Authentication error: ${errorMessage}`,
    };
  }
}

// Handle OAuth callback and exchange code for session
export async function handleOAuthCallback(
  code: string,
  storedState?: string,
  receivedState?: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate CSRF state if provided
    if (storedState && receivedState && storedState !== receivedState) {
      SecurityLogger.logSecurityEvent('oauth_state_mismatch', {
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: 'Security validation failed. Please try signing in again.',
      };
    }

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      errorHandler.handleAuthError('oauth_exchange', error, {
        metadata: { hasCode: !!code },
      });

      return {
        success: false,
        error: error.message || 'Failed to complete sign in',
      };
    }

    // Log successful OAuth completion
    SecurityLogger.logSecurityEvent('oauth_success', {
      timestamp: new Date().toISOString(),
    });

    // Clear OAuth state from sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('oauth_state');
      window.sessionStorage.removeItem('oauth_provider');
    }

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errorHandler.handleAuthError(
      'oauth_callback_error',
      error instanceof Error ? error : new Error(errorMessage),
      {
        metadata: { hasCode: !!code },
      },
    );

    return {
      success: false,
      error: `Authentication failed: ${errorMessage}`,
    };
  }
}

// Check if OAuth is properly configured
export async function checkOAuthProviderStatus(provider: OAuthProvider): Promise<{
  isConfigured: boolean;
  error?: string;
}> {
  try {
    // This is a client-side check - actual provider configuration is on Supabase Dashboard
    const config = providerConfigs[provider];

    if (!config) {
      return {
        isConfigured: false,
        error: 'Provider not supported',
      };
    }

    // For now, we assume providers are configured if they're in our config
    // Actual validation happens when attempting to sign in
    return {
      isConfigured: true,
    };
  } catch {
    return {
      isConfigured: false,
      error: 'Failed to check provider status',
    };
  }
}
