/**
 * Security utilities for user authentication and data protection
 * Provides password validation, rate limiting, and input sanitization
 */

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  sessionTimeout: number; // in minutes
}

// Get environment variable or default
const getEnvNumber = (key: string, defaultValue: number): number => {
  const viteEnvValue = import.meta.env?.[key] as string | undefined;
  if (typeof window !== 'undefined' && viteEnvValue) {
    return parseInt(viteEnvValue, 10) || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return parseInt(process.env[key], 10) || defaultValue;
  }
  return defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const viteEnvValue = import.meta.env?.[key] as string | undefined;
  if (typeof window !== 'undefined' && viteEnvValue) {
    return viteEnvValue === 'true';
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] === 'true';
  }
  return defaultValue;
};

export const defaultSecurityConfig: SecurityConfig = {
  maxLoginAttempts: getEnvNumber('VITE_MAX_LOGIN_ATTEMPTS', 5),
  lockoutDuration: getEnvNumber('VITE_LOCKOUT_DURATION_MINUTES', 15),
  passwordMinLength: getEnvNumber('VITE_PASSWORD_MIN_LENGTH', 8),
  passwordRequireSpecialChar: getEnvBoolean(
    'VITE_PASSWORD_REQUIRE_SPECIAL_CHAR',
    true,
  ),
  passwordRequireNumber: getEnvBoolean('VITE_PASSWORD_REQUIRE_NUMBER', true),
  sessionTimeout: getEnvNumber('VITE_SESSION_TIMEOUT_MINUTES', 60), // 1 hour for seniors
};

/**
 * Password validation with senior-friendly requirements
 */
export function validatePassword(
  password: string,
  config = defaultSecurityConfig,
): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];

  if (password.length < config.passwordMinLength) {
    errors.push(
      `Password must be at least ${config.passwordMinLength} characters long`,
    );
  }

  if (config.passwordRequireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    config.passwordRequireSpecialChar &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*)',
    );
  }

  // Check for common weak patterns
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
  ];
  if (
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Email validation with additional security checks
 */
export function validateEmail(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Check for suspicious patterns
  if (email.includes('..')) {
    errors.push('Email address contains invalid characters');
  }

  // Length check
  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting for login attempts
 */
export class RateLimiter {
  private readonly attempts: Map<
    string,
    { count: number; lastAttempt: number; lockedUntil?: number }
  > = new Map();

  constructor(private readonly config = defaultSecurityConfig) {}

  /**
   * Check if an IP/email is rate limited
   */
  isRateLimited(identifier: string): {
    isLimited: boolean;
    remainingTime?: number;
  } {
    const record = this.attempts.get(identifier);
    if (!record) return { isLimited: false };

    const now = Date.now();

    // Check if still locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60); // minutes
      return { isLimited: true, remainingTime };
    }

    // Reset if lockout period expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      this.attempts.delete(identifier);
      return { isLimited: false };
    }

    return { isLimited: false };
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier) ?? {
      count: 0,
      lastAttempt: 0,
    };

    // Reset count if last attempt was over an hour ago
    if (now - record.lastAttempt > 60 * 60 * 1000) {
      record.count = 0;
    }

    record.count += 1;
    record.lastAttempt = now;

    // Lock account if too many attempts
    if (record.count >= this.config.maxLoginAttempts) {
      record.lockedUntil = now + this.config.lockoutDuration * 60 * 1000;
    }

    this.attempts.set(identifier, record);
  }

  /**
   * Record a successful login (resets attempts)
   */
  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.config.maxLoginAttempts;

    return Math.max(0, this.config.maxLoginAttempts - record.count);
  }
}

/**
 * Input sanitization to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length
}

/**
 * Generate a secure session token (for demo purposes)
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(array);
  } else {
    // Fallback for non-browser/test environments (not cryptographically secure)
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_KEY = 'auth-session';
  private static readonly TIMEOUT_KEY = 'session-timeout';

  static createSession(userId: string): string {
    const token = generateSessionToken();
    const timeout =
      Date.now() + defaultSecurityConfig.sessionTimeout * 60 * 1000;

    const storage = (globalThis as unknown as { localStorage?: Storage })
      .localStorage;
    if (storage) {
      storage.setItem(
        this.SESSION_KEY,
        JSON.stringify({ userId, token, createdAt: Date.now() }),
      );
      storage.setItem(this.TIMEOUT_KEY, timeout.toString());
    }

    return token;
  }

  static getSession(): {
    userId: string;
    token: string;
    createdAt: number;
  } | null {
    try {
      const storage = (globalThis as unknown as { localStorage?: Storage })
        .localStorage;
      if (!storage) return null;
      const sessionData = storage.getItem(this.SESSION_KEY);
      const timeout = storage.getItem(this.TIMEOUT_KEY);

      if (!sessionData || !timeout) return null;

      // Check if session expired
      if (Date.now() > parseInt(timeout)) {
        this.clearSession();
        return null;
      }

      return JSON.parse(sessionData) as {
        userId: string;
        token: string;
        createdAt: number;
      } | null;
    } catch {
      return null;
    }
  }

  static clearSession(): void {
    const storage = (globalThis as unknown as { localStorage?: Storage })
      .localStorage;
    if (!storage) return;
    storage.removeItem(this.SESSION_KEY);
    storage.removeItem(this.TIMEOUT_KEY);
  }

  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }

  static extendSession(): void {
    const storage = (globalThis as unknown as { localStorage?: Storage })
      .localStorage;
    if (this.isSessionValid() && storage) {
      const timeout =
        Date.now() + defaultSecurityConfig.sessionTimeout * 60 * 1000;
      storage.setItem(this.TIMEOUT_KEY, timeout.toString());
    }
  }
}

/**
 * Content Security Policy helpers
 */
export function validateFileUpload(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    errors.push('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Audit logging for security events
 */
export class SecurityLogger {
  private static logs: Array<{
    timestamp: number;
    event: string;
    details: Record<string, unknown>;
    severity: 'info' | 'warning' | 'error';
  }> = [];

  static log(
    event: string,
    details: Record<string, unknown> = {},
    severity: 'info' | 'warning' | 'error' = 'info',
  ): void {
    this.logs.push({
      timestamp: Date.now(),
      event,
      details: this.sanitizeLogData(details),
      severity,
    });

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // In a real app, this would send to a secure logging service
    if (severity === 'error') {
      console.warn(
        `Security Event [${severity.toUpperCase()}]: ${event}`,
        details,
      );
    }
  }

  private static sanitizeLogData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized = { ...data };
    // Remove sensitive fields
    delete (sanitized as { password?: unknown }).password;
    delete (sanitized as { token?: unknown }).token;
    delete (sanitized as { sessionId?: unknown }).sessionId;
    return sanitized;
  }

  static getLogs(severity?: 'info' | 'warning' | 'error'): Array<{
    timestamp: number;
    event: string;
    details: Record<string, unknown>;
    severity: 'info' | 'warning' | 'error';
  }> {
    if (severity) {
      return this.logs.filter((log) => log.severity === severity);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
