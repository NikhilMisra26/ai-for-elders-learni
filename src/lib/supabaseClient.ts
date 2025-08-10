import type { SupabaseClient } from '@supabase/supabase-js';
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
  console.log('[Supabase] 🔍 Starting comprehensive environment validation...');

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const errors: string[] = [];
  const isProduction = import.meta.env.MODE === 'production';

  // Log all available environment variables for debugging
  const allViteEnvVars = Object.keys(import.meta.env).filter((key) =>
    key.startsWith('VITE_'),
  );
  console.log(
    '[Supabase] 🔍 All available VITE_ environment variables:',
    allViteEnvVars,
  );

  console.log('[Supabase] 🔍 Environment variables status:', {
    hasUrl: !!url,
    hasKey: !!anonKey,
    urlLength: url?.length || 0,
    keyLength: anonKey?.length || 0,
    mode: import.meta.env.MODE,
    isProduction,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    urlType: typeof url,
    keyType: typeof anonKey,
  });

  // Special handling for completely missing environment variables
  if (url === undefined) {
    console.error(
      '[Supabase] ❌ VITE_SUPABASE_URL is completely undefined - check your .env file',
    );
  }
  if (anonKey === undefined) {
    console.error(
      '[Supabase] ❌ VITE_SUPABASE_ANON_KEY is completely undefined - check your .env file',
    );
  }

  // Validate URL
  if (!url) {
    const error = 'VITE_SUPABASE_URL is required';
    errors.push(error);
    console.error('[Supabase] Validation error:', error);
  } else if (typeof url !== 'string' || url.trim().length === 0) {
    const error = 'VITE_SUPABASE_URL must be a non-empty string';
    errors.push(error);
    console.error('[Supabase] Validation error:', error);
  } else {
    try {
      new URL(url);
      console.log('[Supabase] URL validation passed:', url);
    } catch (urlError) {
      const error = 'VITE_SUPABASE_URL must be a valid URL';
      errors.push(error);
      console.error(
        '[Supabase] Validation error:',
        error,
        'URL provided:',
        url,
      );
    }
  }

  // Validate anonymous key
  if (!anonKey) {
    const error = 'VITE_SUPABASE_ANON_KEY is required';
    errors.push(error);
    console.error('[Supabase] Validation error:', error);
  } else if (typeof anonKey !== 'string' || anonKey.trim().length === 0) {
    const error = 'VITE_SUPABASE_ANON_KEY must be a non-empty string';
    errors.push(error);
    console.error('[Supabase] Validation error:', error);
  } else if (anonKey.length < 100) {
    const error = 'VITE_SUPABASE_ANON_KEY appears to be invalid (too short)';
    errors.push(error);
    console.error(
      '[Supabase] Validation error:',
      error,
      'Key length:',
      anonKey.length,
    );
  } else {
    console.log(
      '[Supabase] Anonymous key validation passed (length:',
      anonKey.length,
      ')',
    );
  }

  // Log validation results
  if (errors.length > 0) {
    const errorMessage = `Supabase configuration validation failed: ${errors.join(', ')}`;
    console.error('[Supabase] Configuration validation failed:', errors);

    if (isProduction) {
      console.error(
        '[Supabase] Production mode: Configuration errors are critical',
      );
      errorHandler.logError(
        errorMessage,
        new Error('Invalid Supabase configuration'),
        {
          component: 'supabase',
          action: 'validate_config',
          metadata: { errors, hasUrl: !!url, hasKey: !!anonKey },
        },
      );

      // In production, don't throw - allow graceful degradation instead
      console.error(
        '[Supabase] Production mode: Will continue with degraded functionality',
      );
    } else {
      console.warn(
        '[Supabase] Development mode: Will continue with degraded functionality',
      );
      errorHandler.logWarning(errorMessage, {
        component: 'supabase',
        action: 'validate_config',
        metadata: { errors },
      });
    }
  } else {
    console.log('[Supabase] Configuration validation successful');
    errorHandler.logInfo('Supabase configuration validated successfully', {
      component: 'supabase',
      action: 'validate_config',
    });
  }

  const config = {
    url: url ?? '',
    anonKey: anonKey ?? '',
    isValid: errors.length === 0,
    errors,
  };

  console.log('[Supabase] Configuration result:', {
    isValid: config.isValid,
    errorCount: config.errors.length,
    errors: config.errors,
  });

  return config;
}

// Validate configuration at module load
const config = validateEnvironment();

// Mock client that provides safe fallbacks when Supabase is unavailable
const createMockClient = () => {
  console.warn(
    '[Supabase] 🔧 Creating mock client due to invalid configuration',
  );
  console.warn(
    '[Supabase] 🔧 This mock client will provide safe fallbacks for all Supabase operations',
  );
  console.warn(
    '[Supabase] 🔧 Application will continue running with limited functionality',
  );

  const mockError = {
    message: 'Supabase is not available - configuration is invalid',
    details: config.errors.join(', '),
    code: 'SUPABASE_UNAVAILABLE',
    hint: 'Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables',
  };

  console.log(
    '[Supabase] 🔧 Mock client will return this error for all operations:',
    mockError,
  );

  // Create chainable mock query builder
  const createMockQueryBuilder = () => {
    const mockResult = Promise.resolve({ data: null, error: mockError });

    const queryBuilder = {
      select: () => queryBuilder,
      insert: () => queryBuilder,
      update: () => queryBuilder,
      delete: () => queryBuilder,
      upsert: () => queryBuilder,
      eq: () => queryBuilder,
      neq: () => queryBuilder,
      gt: () => queryBuilder,
      gte: () => queryBuilder,
      lt: () => queryBuilder,
      lte: () => queryBuilder,
      like: () => queryBuilder,
      ilike: () => queryBuilder,
      is: () => queryBuilder,
      in: () => queryBuilder,
      contains: () => queryBuilder,
      containedBy: () => queryBuilder,
      rangeGt: () => queryBuilder,
      rangeGte: () => queryBuilder,
      rangeLt: () => queryBuilder,
      rangeLte: () => queryBuilder,
      rangeAdjacent: () => queryBuilder,
      overlaps: () => queryBuilder,
      textSearch: () => queryBuilder,
      match: () => queryBuilder,
      not: () => queryBuilder,
      or: () => queryBuilder,
      filter: () => queryBuilder,
      order: () => queryBuilder,
      limit: () => queryBuilder,
      range: () => queryBuilder,
      single: async () => mockResult,
      maybeSingle: async () => mockResult,
      then: async (resolve: any) => mockResult.then(resolve),
      catch: async (reject: any) => mockResult.catch(reject),
    };

    // Make it thenable so it can be awaited directly
    return Object.assign(mockResult, queryBuilder);
  };

  return {
    auth: {
      getSession: async () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: async () =>
        Promise.resolve({ data: { user: null }, error: null }),
      signUp: async () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: mockError,
        }),
      signInWithPassword: async () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: mockError,
        }),
      signOut: async () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (table: string) => createMockQueryBuilder(),
    // Add other required properties to match SupabaseClient interface
    supabaseUrl: '',
    supabaseKey: '',
    realtime: {} as any,
    storage: {} as any,
    channel: () => ({}) as any,
    getChannels: () => [],
    removeAllChannels: async () => Promise.resolve('ok'),
    removeChannel: async () => Promise.resolve('ok'),
    functions: {
      invoke: async () => Promise.resolve({ data: null, error: mockError }),
    } as any,
    rpc: () => createMockQueryBuilder(),
  } as unknown as SupabaseClient;
};

// Create Supabase client with defensive error handling
let supabaseClient: SupabaseClient;

console.log('[Supabase] Beginning client initialization process...');
console.log('[Supabase] Configuration status:', {
  isValid: config.isValid,
  hasUrl: !!config.url,
  hasKey: !!config.anonKey,
  urlPreview: config.url ? `${config.url.substring(0, 30)}...` : 'MISSING',
  keyLength: config.anonKey?.length || 0,
  errorCount: config.errors.length,
});

if (!config.isValid) {
  console.warn(
    '[Supabase] ⚠️  Configuration validation failed - cannot create real Supabase client',
  );
  console.warn('[Supabase] ⚠️  Configuration errors:', config.errors);
  console.warn(
    '[Supabase] ⚠️  Falling back to mock client for graceful degradation',
  );

  // Log detailed environment variable status for debugging
  console.log('[Supabase] Environment variable debug info:', {
    VITE_SUPABASE_URL: config.url ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: config.anonKey ? 'SET' : 'MISSING',
    allEnvVars: Object.keys(import.meta.env).filter((key) =>
      key.startsWith('VITE_'),
    ),
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  });

  supabaseClient = createMockClient();
  console.log(
    '[Supabase] ✅ Mock client created successfully - app will run with limited functionality',
  );
} else {
  console.log(
    '[Supabase] ✅ Configuration is valid, attempting to create real Supabase client...',
  );
  console.log('[Supabase] Using URL:', config.url);
  console.log('[Supabase] Using key length:', config.anonKey.length);

  try {
    console.log(
      '[Supabase] Calling createClient() with validated configuration...',
    );

    // Extra safety check - verify environment variables exist at creation time
    if (!config.url || !config.anonKey) {
      throw new Error(
        'Configuration became invalid during client creation - URL or key is missing',
      );
    }

    // Validate URL format one more time before creation
    try {
      new URL(config.url);
    } catch (urlError) {
      throw new Error(
        `Invalid URL format during client creation: ${config.url}`,
      );
    }

    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    console.log('[Supabase] ✅ Real Supabase client created successfully');
    console.log(
      '[Supabase] ✅ Client configuration confirmed with provided URL and key',
    );
  } catch (clientError) {
    console.error(
      '[Supabase] ❌ CRITICAL: Failed to create Supabase client despite valid configuration',
    );
    console.error('[Supabase] ❌ Creation error details:', {
      error: clientError,
      errorMessage:
        clientError instanceof Error
          ? clientError.message
          : String(clientError),
      errorType: typeof clientError,
      configUrl: config.url,
      configKeyLength: config.anonKey?.length || 0,
      isValidConfig: config.isValid,
    });

    errorHandler.logError(
      'Critical failure: Cannot create Supabase client despite valid configuration',
      clientError instanceof Error
        ? clientError
        : new Error(String(clientError)),
      {
        component: 'supabase',
        action: 'create_client_critical_failure',
        metadata: {
          configValid: config.isValid,
          configErrors: config.errors,
          url: config.url ? `${config.url.substring(0, 20)}...` : 'none',
          keyLength: config.anonKey?.length || 0,
          clientCreationAttempt: true,
          environment: import.meta.env.MODE,
        },
      },
    );

    console.warn(
      '[Supabase] ⚠️  Falling back to mock client due to creation failure',
    );
    supabaseClient = createMockClient();
    console.log(
      '[Supabase] ✅ Mock client created as fallback - app will run with limited functionality',
    );
  }
}

// Final verification that we have a client
if (!supabaseClient) {
  console.error(
    '[Supabase] ❌ FATAL: No client was created - this should never happen',
  );
  console.error('[Supabase] ❌ Creating emergency mock client...');
  supabaseClient = createMockClient();
}

console.log('[Supabase] Client initialization completed successfully');
console.log('[Supabase] Final client type:', config.isValid ? 'REAL' : 'MOCK');

export const supabase = supabaseClient;

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
  console.log(
    `[Supabase] 🔄 Executing operation: ${context.operation}${context.table ? ` on ${context.table}` : ''}`,
  );
  console.log(`[Supabase] 🔄 Operation context:`, {
    operation: context.operation,
    table: context.table || 'N/A',
    userId: context.userId || 'anonymous',
    clientType: config.isValid ? 'real' : 'mock',
    configValid: config.isValid,
  });

  if (!config.isValid) {
    const configError = new Error(
      `Supabase not properly configured: ${config.errors.join(', ')}`,
    );
    console.warn(
      '[Supabase] ❌ Operation failed due to invalid configuration:',
      {
        operation: context.operation,
        table: context.table,
        userId: context.userId,
        configErrors: config.errors,
        availableFeatures: 'limited (mock client only)',
      },
    );

    const errorId = errorHandler.handleDatabaseError(
      `${context.operation}${context.table ? ` on ${context.table}` : ''}`,
      configError,
      {
        component: 'supabase',
        userId: context.userId,
        metadata: {
          configErrors: config.errors,
          operationAttempted: context.operation,
          tableAttempted: context.table,
        },
      },
    );

    return { data: null, error: configError, errorId };
  }

  try {
    console.log(
      '[Supabase] ⏳ Attempting operation with valid configuration...',
    );
    const result = await operation();
    console.log('[Supabase] ✅ Operation completed successfully:', {
      operation: context.operation,
      table: context.table || 'N/A',
      hasResult: !!result,
      resultType: typeof result,
    });
    return { data: result, error: null };
  } catch (error) {
    const errorInstance =
      error instanceof Error ? error : new Error(String(error));

    console.error('[Supabase] Operation failed with error:', {
      operation: context.operation,
      table: context.table,
      error: errorInstance.message,
      hasValidConfig: config.isValid,
    });

    const errorId = errorHandler.handleDatabaseError(
      `${context.operation}${context.table ? ` on ${context.table}` : ''}`,
      errorInstance,
      {
        component: 'supabase',
        userId: context.userId,
        metadata: {
          table: context.table,
          hasValidConfig: config.isValid,
          clientType: config.isValid ? 'real' : 'mock',
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
  clientInitialized: boolean;
  errors: string[];
}> {
  console.log('[Supabase] Starting health check...');

  const result = {
    healthy: false,
    configValid: config.isValid,
    connectionWorking: false,
    clientInitialized: true, // Always true now since we always have a client (real or mock)
    errors: [...config.errors],
  };

  console.log('[Supabase] Health check initial state:', result);

  if (!config.isValid) {
    console.warn('[Supabase] Health check failed: Invalid configuration');
    return result;
  }

  // Note: supabaseClient is always initialized (either real or mock)
  // The health check is more about testing connectivity

  try {
    console.log('[Supabase] Attempting connection test...');

    // Simple query to check connection - wrap in try-catch for extra safety
    const queryResult = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    console.log('[Supabase] Connection test result:', {
      hasData: !!queryResult.data,
      hasError: !!queryResult.error,
      errorMessage: queryResult.error?.message,
    });

    if (queryResult.error) {
      result.errors.push(
        `Connection test failed: ${queryResult.error.message}`,
      );
      console.warn(
        '[Supabase] Connection test failed:',
        queryResult.error.message,
      );

      errorHandler.logWarning('Supabase health check failed', {
        component: 'supabase',
        action: 'health_check',
        metadata: { error: queryResult.error.message },
      });
    } else {
      result.connectionWorking = true;
      result.healthy = true;
      console.log('[Supabase] Health check passed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Health check error: ${errorMessage}`);

    console.error('[Supabase] Health check exception:', {
      error: errorMessage,
      type: typeof error,
      hasClient: true, // Always true now
    });

    errorHandler.logError(
      'Supabase health check error',
      error instanceof Error ? error : new Error(errorMessage),
      {
        component: 'supabase',
        action: 'health_check',
        metadata: {
          clientInitialized: true, // Always true now
          configValid: config.isValid,
        },
      },
    );
  }

  console.log('[Supabase] Health check completed:', result);
  return result;
}

// Export configuration status for debugging
export const supabaseStatus = {
  isConfigValid: config.isValid,
  configErrors: config.errors,
  hasUrl: !!config.url,
  hasKey: !!config.anonKey,
  clientInitialized: true, // Always true now
  isMockClient: !config.isValid,
  environment: import.meta.env.MODE,
};

// Helper function to check if we're using a real or mock client
export const isSupabaseAvailable = (): boolean => {
  return config.isValid;
};

// Log final initialization status
console.log('[Supabase] 📊 === FINAL INITIALIZATION SUMMARY ===');
console.log('[Supabase] 📊 Configuration Status:', {
  isValid: config.isValid,
  errorCount: config.errors.length,
  environment: supabaseStatus.environment,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
});

console.log('[Supabase] 📊 Client Status:', {
  clientType: supabaseStatus.isMockClient
    ? 'MOCK (Limited Functionality)'
    : 'REAL (Full Functionality)',
  clientInitialized: supabaseStatus.clientInitialized,
  hasUrl: supabaseStatus.hasUrl,
  hasKey: supabaseStatus.hasKey,
  isSupabaseAvailable: isSupabaseAvailable(),
});

if (!config.isValid) {
  console.warn('[Supabase] ⚠️  === RUNNING IN DEGRADED MODE ===');
  console.warn(
    '[Supabase] ⚠️  Application will run with LIMITED FUNCTIONALITY due to invalid Supabase configuration',
  );
  console.warn('[Supabase] ⚠️  The following features will not work:');
  console.warn('[Supabase] ⚠️    - User authentication and registration');
  console.warn('[Supabase] ⚠️    - Course progress saving');
  console.warn('[Supabase] ⚠️    - Subscription management');
  console.warn('[Supabase] ⚠️    - User profile data');
  console.warn('[Supabase] ⚠️  Configuration errors:', config.errors);
  console.warn(
    '[Supabase] ⚠️  To fix: Set proper VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file',
  );
} else {
  console.log('[Supabase] ✅ === FULLY OPERATIONAL ===');
  console.log(
    '[Supabase] ✅ Supabase client initialized successfully and ready for all operations',
  );
  console.log(
    '[Supabase] ✅ All features available: authentication, data storage, real-time updates',
  );
}

console.log('[Supabase] 📊 === END INITIALIZATION SUMMARY ===');
