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

export const defaultSecurityConfig: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  sessionTimeout: 60, // 1 hour for seniors
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
    const record = this.attempts.get(identifier) || {
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
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length
}

/**
 * Generate a secure session token (for demo purposes)
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
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

    localStorage.setItem(
      this.SESSION_KEY,
      JSON.stringify({ userId, token, createdAt: Date.now() }),
    );
    localStorage.setItem(this.TIMEOUT_KEY, timeout.toString());

    return token;
  }

  static getSession(): {
    userId: string;
    token: string;
    createdAt: number;
  } | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      const timeout = localStorage.getItem(this.TIMEOUT_KEY);

      if (!sessionData || !timeout) return null;

      // Check if session expired
      if (Date.now() > parseInt(timeout)) {
        this.clearSession();
        return null;
      }

      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.TIMEOUT_KEY);
  }

  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }

  static extendSession(): void {
    if (this.isSessionValid()) {
      const timeout =
        Date.now() + defaultSecurityConfig.sessionTimeout * 60 * 1000;
      localStorage.setItem(this.TIMEOUT_KEY, timeout.toString());
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
    details: any;
    severity: 'info' | 'warning' | 'error';
  }> = [];

  static log(
    event: string,
    details: any = {},
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

  private static sanitizeLogData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.sessionId;
      return sanitized;
    }
    return data;
  }

  static getLogs(severity?: 'info' | 'warning' | 'error'): typeof this.logs {
    if (severity) {
      return this.logs.filter((log) => log.severity === severity);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
