/**
 * Unified log sanitization utility
 * Removes or masks sensitive information from log data
 */

/**
 * List of sensitive keys to redact from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'credential',
  'private',
  'ssn',
  'email',
  'phone',
  'address',
  'creditcard',
  'credit_card',
  'cvv',
  'pin',
  'session',
  'cookie',
  'jwt',
  'refresh_token',
  'access_token',
  'id_token',
];

/**
 * Patterns to detect and redact sensitive data
 */
const SENSITIVE_PATTERNS = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
  },
  {
    name: 'phone',
    pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    replacement: '[PHONE_REDACTED]',
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
  },
  {
    name: 'credit_card',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
  },
  {
    name: 'jwt',
    pattern: /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g,
    replacement: '[JWT_REDACTED]',
  },
];

/**
 * Sanitize a single value based on its type and content
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // Apply pattern-based redaction
    let sanitized = value;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    return sanitizeLogData(value as Record<string, unknown>);
  }

  return value;
}

/**
 * Sanitize log data by removing or masking sensitive information
 * @param data - The data object to sanitize
 * @returns Sanitized copy of the data
 */
export function sanitizeLogData<T extends Record<string, unknown>>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive terms
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey));

    if (isSensitive) {
      // Redact sensitive keys
      sanitized[key] = '[REDACTED]';
    } else if (key === 'error' && value instanceof Error) {
      // Special handling for Error objects
      sanitized[key] = {
        message: sanitizeValue(value.message),
        name: value.name,
        stack: value.stack
          ? value.stack.split('\n').slice(0, 3).join('\n') + '\n...[TRUNCATED]'
          : undefined,
      };
    } else if (key === 'stack' && typeof value === 'string') {
      // Truncate stack traces
      sanitized[key] = value.split('\n').slice(0, 3).join('\n') + '\n...[TRUNCATED]';
    } else if (key === 'headers' && typeof value === 'object') {
      // Special handling for HTTP headers
      const headers = value as Record<string, unknown>;
      sanitized[key] = Object.fromEntries(
        Object.entries(headers).map(([headerKey, headerValue]) => {
          const lowerHeaderKey = headerKey.toLowerCase();
          if (
            lowerHeaderKey.includes('authorization') ||
            lowerHeaderKey.includes('cookie') ||
            lowerHeaderKey.includes('token')
          ) {
            return [headerKey, '[REDACTED]'];
          }
          return [headerKey, sanitizeValue(headerValue)];
        }),
      );
    } else {
      // Recursively sanitize nested values
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized as T;
}

/**
 * Sanitize error details for logging
 * Preserves error structure while removing sensitive information
 */
export function sanitizeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error) {
    return { message: 'Unknown error' };
  }

  if (error instanceof Error) {
    const errorData: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    // Include any additional properties from the error object
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key) && !errorData[key]) {
        errorData[key] = (error as unknown as Record<string, unknown>)[key];
      }
    }
    return sanitizeLogData(errorData);
  }

  if (typeof error === 'object') {
    return sanitizeLogData(error as Record<string, unknown>);
  }

  return { message: String(error) };
}

/**
 * Create a safe log message from potentially sensitive data
 * @param message - The log message
 * @param data - Additional data to include
 * @returns Safe log object
 */
export function createSafeLogMessage(
  message: string,
  data?: Record<string, unknown>,
): { message: string; data?: Record<string, unknown> } {
  const safeMessage = sanitizeValue(message) as string;

  if (!data) {
    return { message: safeMessage };
  }

  return {
    message: safeMessage,
    data: sanitizeLogData(data),
  };
}
