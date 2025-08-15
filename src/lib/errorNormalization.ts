/**
 * Error Normalization and Security Module
 * Provides centralized error handling with sensitive data protection
 */

import { SecurityLogger } from './security';

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_RATE_LIMITED = 'AUTH_RATE_LIMITED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  AUTH_USER_EXISTS = 'AUTH_USER_EXISTS',

  // Validation errors
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELDS = 'VALIDATION_MISSING_FIELDS',

  // Database errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CARD_DECLINED = 'PAYMENT_CARD_DECLINED',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_INSUFFICIENT_FUNDS',
  PAYMENT_SUBSCRIPTION_EXPIRED = 'PAYMENT_SUBSCRIPTION_EXPIRED',

  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',

  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVER_MAINTENANCE = 'SERVER_MAINTENANCE',

  // Generic errors
  GENERIC_ERROR = 'GENERIC_ERROR',
  FEATURE_UNAVAILABLE = 'FEATURE_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * User-friendly error messages mapped to error codes
 */
const userFriendlyMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.AUTH_INVALID_CREDENTIALS]:
    'The email or password you entered is incorrect. Please try again.',
  [ErrorCode.AUTH_RATE_LIMITED]:
    'Too many login attempts. Please wait a few minutes and try again.',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'You do not have permission to access this feature.',
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address before logging in.',
  [ErrorCode.AUTH_WEAK_PASSWORD]: 'Please choose a stronger password with at least 8 characters.',
  [ErrorCode.AUTH_USER_EXISTS]: 'An account with this email already exists.',

  // Validation
  [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCode.VALIDATION_INVALID_INPUT]: 'Please check your input and try again.',
  [ErrorCode.VALIDATION_MISSING_FIELDS]: 'Please fill in all required fields.',

  // Database
  [ErrorCode.DB_CONNECTION_FAILED]:
    'Unable to connect to our servers. Please check your internet connection.',
  [ErrorCode.DB_QUERY_FAILED]: 'Something went wrong. Please try again.',
  [ErrorCode.DB_TRANSACTION_FAILED]: 'Unable to complete your request. Please try again.',

  // Payment
  [ErrorCode.PAYMENT_FAILED]: 'Payment could not be processed. Please try again.',
  [ErrorCode.PAYMENT_CARD_DECLINED]:
    'Your card was declined. Please try a different payment method.',
  [ErrorCode.PAYMENT_INSUFFICIENT_FUNDS]:
    'Insufficient funds. Please try a different payment method.',
  [ErrorCode.PAYMENT_SUBSCRIPTION_EXPIRED]:
    'Your subscription has expired. Please renew to continue.',

  // Network
  [ErrorCode.NETWORK_TIMEOUT]: 'The request took too long. Please try again.',
  [ErrorCode.NETWORK_OFFLINE]: 'You appear to be offline. Please check your internet connection.',
  [ErrorCode.NETWORK_REQUEST_FAILED]: 'Unable to complete your request. Please try again.',

  // Server
  [ErrorCode.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCode.SERVER_MAINTENANCE]:
    'We are currently performing maintenance. Please try again later.',

  // Generic
  [ErrorCode.GENERIC_ERROR]: 'An error occurred. Please try again.',
  [ErrorCode.FEATURE_UNAVAILABLE]: 'This feature is temporarily unavailable.',
  [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
};

/**
 * Map Supabase/API error messages to error codes
 */
const errorMessageMappings: Array<{ pattern: RegExp; code: ErrorCode }> = [
  // Authentication errors
  {
    pattern: /invalid.*credentials/i,
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
  },
  { pattern: /password.*incorrect/i, code: ErrorCode.AUTH_INVALID_CREDENTIALS },
  { pattern: /user.*not.*found/i, code: ErrorCode.AUTH_INVALID_CREDENTIALS },
  { pattern: /invalid.*login/i, code: ErrorCode.AUTH_INVALID_CREDENTIALS },
  { pattern: /rate.*limit/i, code: ErrorCode.AUTH_RATE_LIMITED },
  { pattern: /too.*many.*request/i, code: ErrorCode.AUTH_RATE_LIMITED },
  { pattern: /session.*expire/i, code: ErrorCode.AUTH_SESSION_EXPIRED },
  { pattern: /token.*expire/i, code: ErrorCode.AUTH_SESSION_EXPIRED },
  { pattern: /unauthoriz/i, code: ErrorCode.AUTH_UNAUTHORIZED },
  { pattern: /email.*verif/i, code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED },
  { pattern: /weak.*password/i, code: ErrorCode.AUTH_WEAK_PASSWORD },
  { pattern: /user.*already.*exist/i, code: ErrorCode.AUTH_USER_EXISTS },
  { pattern: /email.*already.*registered/i, code: ErrorCode.AUTH_USER_EXISTS },
  { pattern: /duplicate.*key.*value/i, code: ErrorCode.AUTH_USER_EXISTS },
  { pattern: /unique.*constraint/i, code: ErrorCode.AUTH_USER_EXISTS },

  // Validation errors
  { pattern: /invalid.*email/i, code: ErrorCode.VALIDATION_INVALID_EMAIL },
  { pattern: /email.*format/i, code: ErrorCode.VALIDATION_INVALID_EMAIL },
  { pattern: /validation.*fail/i, code: ErrorCode.VALIDATION_INVALID_INPUT },
  { pattern: /invalid.*input/i, code: ErrorCode.VALIDATION_INVALID_INPUT },
  { pattern: /required.*field/i, code: ErrorCode.VALIDATION_MISSING_FIELDS },

  // Database errors
  { pattern: /connection.*fail/i, code: ErrorCode.DB_CONNECTION_FAILED },
  { pattern: /database.*error/i, code: ErrorCode.DB_QUERY_FAILED },
  { pattern: /query.*fail/i, code: ErrorCode.DB_QUERY_FAILED },
  { pattern: /transaction.*fail/i, code: ErrorCode.DB_TRANSACTION_FAILED },

  // Payment errors
  { pattern: /payment.*fail/i, code: ErrorCode.PAYMENT_FAILED },
  { pattern: /card.*decline/i, code: ErrorCode.PAYMENT_CARD_DECLINED },
  {
    pattern: /insufficient.*fund/i,
    code: ErrorCode.PAYMENT_INSUFFICIENT_FUNDS,
  },
  {
    pattern: /subscription.*expire/i,
    code: ErrorCode.PAYMENT_SUBSCRIPTION_EXPIRED,
  },

  // Network errors
  { pattern: /timeout/i, code: ErrorCode.NETWORK_TIMEOUT },
  { pattern: /network.*error/i, code: ErrorCode.NETWORK_REQUEST_FAILED },
  { pattern: /fetch.*fail/i, code: ErrorCode.NETWORK_REQUEST_FAILED },

  // Server errors
  { pattern: /internal.*server/i, code: ErrorCode.SERVER_ERROR },
  { pattern: /500/i, code: ErrorCode.SERVER_ERROR },
  { pattern: /maintenance/i, code: ErrorCode.SERVER_MAINTENANCE },

  // Permission errors
  { pattern: /permission.*denied/i, code: ErrorCode.PERMISSION_DENIED },
  { pattern: /access.*denied/i, code: ErrorCode.PERMISSION_DENIED },
  { pattern: /forbidden/i, code: ErrorCode.PERMISSION_DENIED },

  // Supabase-specific errors
  { pattern: /refresh.*token.*invalid/i, code: ErrorCode.AUTH_SESSION_EXPIRED },
  { pattern: /jwt.*expired/i, code: ErrorCode.AUTH_SESSION_EXPIRED },
  { pattern: /jwt.*malformed/i, code: ErrorCode.AUTH_UNAUTHORIZED },
  { pattern: /invalid.*grant/i, code: ErrorCode.AUTH_INVALID_CREDENTIALS },
  { pattern: /user.*not.*confirmed/i, code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED },
  { pattern: /otp.*expired/i, code: ErrorCode.AUTH_SESSION_EXPIRED },
  { pattern: /otp.*invalid/i, code: ErrorCode.AUTH_INVALID_CREDENTIALS },
  {
    pattern: /email.*not.*confirmed/i,
    code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
  },
  {
    pattern: /password.*recovery.*token/i,
    code: ErrorCode.AUTH_SESSION_EXPIRED,
  },
  { pattern: /row.*level.*security/i, code: ErrorCode.PERMISSION_DENIED },
  { pattern: /violates.*foreign.*key/i, code: ErrorCode.DB_QUERY_FAILED },
  { pattern: /deadlock.*detected/i, code: ErrorCode.DB_TRANSACTION_FAILED },
];

/**
 * Extract error code from error message
 */
function extractErrorCode(message: string): ErrorCode {
  const lowerMessage = message.toLowerCase();

  for (const mapping of errorMessageMappings) {
    if (mapping.pattern.test(lowerMessage)) {
      return mapping.code;
    }
  }

  return ErrorCode.GENERIC_ERROR;
}

/**
 * Sanitize string values by truncating long content
 */
function sanitizeStringValue(value: string): string {
  return value.substring(0, 200);
}

/**
 * Sanitize error details to remove sensitive information
 */
function sanitizeErrorDetails(error: unknown): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  if (error instanceof Error) {
    // Only include safe properties
    sanitized.name = error.name;
    sanitized.message = error.message;

    // Remove sensitive stack trace in production
    if (import.meta.env.DEV) {
      sanitized.stack = error.stack;
    }
  } else if (typeof error === 'object' && error !== null) {
    // Sanitize object properties
    const errorObj = error as Record<string, unknown>;
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential', 'auth'];

    for (const [key, value] of Object.entries(errorObj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));

      if (!isSensitive) {
        sanitized[key] = typeof value === 'string' ? value.substring(0, 200) : value;
      }
    }
  } else {
    sanitized.type = typeof error;
    sanitized.value = sanitizeStringValue(String(error));
  }

  return sanitized;
}

/**
 * Normalized error response
 */
export interface NormalizedError {
  message: string;
  code: ErrorCode;
  timestamp: number;
  requestId?: string;
}

/**
 * Main error normalization function
 * Logs full error internally and returns safe user-facing message
 */
export function normalizeError(
  error: unknown,
  context?: string,
  requestId?: string,
): NormalizedError {
  // Generate request ID if not provided
  const reqId = requestId ?? generateRequestId();

  // Extract error details
  let errorMessage = 'Unknown error';
  let errorCode = ErrorCode.GENERIC_ERROR;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = extractErrorCode(errorMessage);
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorCode = extractErrorCode(errorMessage);
  } else if (error && typeof error === 'object') {
    const errorObj = error as {
      message?: string;
      code?: string;
      error?: string;
    };
    errorMessage = errorObj.message ?? errorObj.error ?? 'Unknown error';
    errorCode = extractErrorCode(errorMessage);
  }

  // Log full error details internally (only in development or to secure logging service)
  const sanitizedDetails = sanitizeErrorDetails(error);
  SecurityLogger.log(
    'error_normalized',
    {
      requestId: reqId,
      context,
      errorCode,
      originalMessage: errorMessage,
      details: sanitizedDetails,
    },
    'error',
  );

  // Log detailed error in development only
  if (import.meta.env.DEV) {
    SecurityLogger.log(
      'error_detailed_debug',
      {
        requestId: reqId,
        context,
        errorCode,
        originalError: sanitizedDetails,
        message: errorMessage,
      },
      'info',
    );
  }

  // Return normalized error with safe user-facing message
  return {
    message: userFriendlyMessages[errorCode],
    code: errorCode,
    timestamp: Date.now(),
    requestId: reqId,
  };
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Error boundary helper for React components
 */
export function normalizeReactError(
  error: Error,
  errorInfo: { componentStack: string },
): NormalizedError {
  const normalized = normalizeError(error, 'React Component Error');

  // Log component stack in development
  if (import.meta.env.DEV) {
    SecurityLogger.log(
      'react_component_stack_debug',
      {
        requestId: normalized.requestId,
        componentStack: errorInfo.componentStack,
      },
      'info',
    );
  }

  SecurityLogger.log(
    'react_error_boundary',
    {
      requestId: normalized.requestId,
      errorCode: normalized.code,
      componentStack: errorInfo.componentStack,
    },
    'error',
  );

  return normalized;
}

/**
 * Helper to check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('offline')
    );
  }
  return false;
}

/**
 * Helper to check if error is authentication-related
 */
export function isAuthError(code: ErrorCode): boolean {
  return code.startsWith('AUTH_');
}

/**
 * Helper to check if error is payment-related
 */
export function isPaymentError(code: ErrorCode): boolean {
  return code.startsWith('PAYMENT_');
}

/**
 * Helper to determine if error should trigger retry
 */
export function isRetryableError(code: ErrorCode): boolean {
  const retryableCodes = [
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.NETWORK_REQUEST_FAILED,
    ErrorCode.DB_CONNECTION_FAILED,
    ErrorCode.SERVER_ERROR,
  ];

  return retryableCodes.includes(code);
}

/**
 * Format error message for display with optional details
 */
export function formatErrorMessage(error: NormalizedError, includeRequestId = false): string {
  if (includeRequestId && error.requestId) {
    return `${error.message} (Reference: ${error.requestId})`;
  }
  return error.message;
}

/**
 * Extract error message from Supabase error response
 */
export function extractSupabaseError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  const errorObj = error as {
    message?: string;
    error?: string;
    error_description?: string;
    msg?: string;
    details?: string;
    code?: string;
    status?: number;
  };

  // Try different error message fields in order of preference
  return (
    errorObj.message ??
    errorObj.error_description ??
    errorObj.error ??
    errorObj.msg ??
    errorObj.details ??
    'An unexpected error occurred'
  );
}

/**
 * Handle Supabase Auth errors specifically
 */
export function normalizeSupabaseAuthError(error: unknown, context: string): NormalizedError {
  const errorMessage = extractSupabaseError(error);

  // Check for specific Supabase auth error patterns
  if (errorMessage.includes('Email not confirmed')) {
    return {
      message: 'Please verify your email address before signing in.',
      code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
      timestamp: Date.now(),
      requestId: generateRequestId(),
    };
  }

  if (errorMessage.includes('Invalid login credentials')) {
    return {
      message: 'The email or password you entered is incorrect.',
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      timestamp: Date.now(),
      requestId: generateRequestId(),
    };
  }

  // Fall back to general normalization
  return normalizeError(error, context);
}

/**
 * Get error recovery suggestions based on error code
 */
export function getErrorRecoverySuggestion(code: ErrorCode): string | null {
  const suggestions: Partial<Record<ErrorCode, string>> = {
    [ErrorCode.AUTH_INVALID_CREDENTIALS]:
      'Double-check your email and password, or reset your password if needed.',
    [ErrorCode.AUTH_RATE_LIMITED]: 'Wait a few minutes before trying again.',
    [ErrorCode.AUTH_SESSION_EXPIRED]: 'Please sign in again to continue.',
    [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 'Check your email for a verification link.',
    [ErrorCode.AUTH_WEAK_PASSWORD]:
      'Try a password with at least 8 characters, including numbers and symbols.',
    [ErrorCode.NETWORK_OFFLINE]: 'Check your internet connection and try again.',
    [ErrorCode.NETWORK_TIMEOUT]: 'The server is taking longer than usual. Please try again.',
    [ErrorCode.SERVER_ERROR]: 'Our servers are experiencing issues. Please try again later.',
    [ErrorCode.PAYMENT_CARD_DECLINED]: 'Contact your bank or try a different payment method.',
  };

  return suggestions[code] ?? null;
}

/**
 * Check if error is related to authentication/authorization
 */
export function isAuthorizationError(error: unknown): boolean {
  const normalized = normalizeError(error);
  return isAuthError(normalized.code) || normalized.code === ErrorCode.PERMISSION_DENIED;
}

/**
 * Safe error logging for production
 * Only logs non-sensitive information
 */
export function logErrorSafely(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>,
): void {
  const normalized = normalizeError(error, context);
  const safeData = sanitizeErrorDetails(additionalData ?? {});

  SecurityLogger.log(
    'application_error',
    {
      requestId: normalized.requestId,
      errorCode: normalized.code,
      context,
      ...safeData,
    },
    'error',
  );
}
