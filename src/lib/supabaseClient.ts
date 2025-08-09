import { createClient } from '@supabase/supabase-js';

import { errorHandler } from './errorHandler';

// Environment validation and configuration
interface SupabaseConfig {
  url: string;
  anonKey: string;
  isValid: boolean;
  errors: string[];
}

function validateEnvironment(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const errors: string[] = [];
  const isProduction = import.meta.env.MODE === 'production';

  // Validate URL
  if (!url) {
    errors.push('VITE_SUPABASE_URL is required');
  } else if (typeof url !== 'string' || url.trim().length === 0) {
    errors.push('VITE_SUPABASE_URL must be a non-empty string');
  } else {
    try {
      new URL(url);
    } catch {
      errors.push('VITE_SUPABASE_URL must be a valid URL');
    }
  }

  // Validate anonymous key
  if (!anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  } else if (typeof anonKey !== 'string' || anonKey.trim().length === 0) {
    errors.push('VITE_SUPABASE_ANON_KEY must be a non-empty string');
  } else if (anonKey.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  // Log validation results
  if (errors.length > 0) {
    const errorMessage = `Supabase configuration validation failed: ${errors.join(', ')}`;

    if (isProduction) {
      errorHandler.logError(
        errorMessage,
        new Error('Invalid Supabase configuration'),
        {
          component: 'supabase',
          action: 'validate_config',
          metadata: { errors, hasUrl: !!url, hasKey: !!anonKey },
        },
      );

      // In production, throw to prevent app from starting with invalid config
      throw new Error(
        'Application configuration error. Please contact support if this issue persists.',
      );
    } else {
      errorHandler.logWarning(errorMessage, {
        component: 'supabase',
        action: 'validate_config',
        metadata: { errors },
      });
    }
  } else {
    errorHandler.logInfo('Supabase configuration validated successfully', {
      component: 'supabase',
      action: 'validate_config',
    });
  }

  return {
    url: url ?? '',
    anonKey: anonKey ?? '',
    isValid: errors.length === 0,
    errors,
  };
}

// Validate configuration at module load
const config = validateEnvironment();

// Create Supabase client with error handling
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Enhanced client with built-in error handling
interface SupabaseOperation {
  operation: string;
  table?: string;
  userId?: string;
}

export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: SupabaseOperation,
): Promise<{ data: T | null; error: Error | null; errorId?: string }> {
  if (!config.isValid) {
    const configError = new Error(
      `Supabase not properly configured: ${config.errors.join(', ')}`,
    );
    const errorId = errorHandler.handleDatabaseError(
      `${context.operation}${context.table ? ` on ${context.table}` : ''}`,
      configError,
      {
        component: 'supabase',
        userId: context.userId,
        metadata: { configErrors: config.errors },
      },
    );

    return { data: null, error: configError, errorId };
  }

  try {
    const result = await operation();
    return { data: result, error: null };
  } catch (error) {
    const errorInstance =
      error instanceof Error ? error : new Error(String(error));
    const errorId = errorHandler.handleDatabaseError(
      `${context.operation}${context.table ? ` on ${context.table}` : ''}`,
      errorInstance,
      {
        component: 'supabase',
        userId: context.userId,
        metadata: {
          table: context.table,
          hasValidConfig: config.isValid,
        },
      },
    );

    return { data: null, error: errorInstance, errorId };
  }
}

// Health check for Supabase connection
export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;
  configValid: boolean;
  connectionWorking: boolean;
  errors: string[];
}> {
  const result = {
    healthy: false,
    configValid: config.isValid,
    connectionWorking: false,
    errors: [...config.errors],
  };

  if (!config.isValid) {
    return result;
  }

  try {
    // Simple query to check connection
    const { error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      result.errors.push(`Connection test failed: ${error.message}`);
      errorHandler.logWarning('Supabase health check failed', {
        component: 'supabase',
        action: 'health_check',
        metadata: { error: error.message },
      });
    } else {
      result.connectionWorking = true;
      result.healthy = true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Health check error: ${errorMessage}`);
    errorHandler.logError(
      'Supabase health check error',
      error instanceof Error ? error : new Error(errorMessage),
      {
        component: 'supabase',
        action: 'health_check',
      },
    );
  }

  return result;
}

// Export configuration status for debugging
export const supabaseStatus = {
  isConfigValid: config.isValid,
  configErrors: config.errors,
  hasUrl: !!config.url,
  hasKey: !!config.anonKey,
};
