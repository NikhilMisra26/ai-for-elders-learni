/**
 * Security utilities for user authentication and data protection
 * Provides password validation, rate limiting, and input sanitization
 */

import DOMPurify from 'dompurify';

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
    errors.push(`Password must be at least ${config.passwordMinLength} characters long`);
  }

  if (config.passwordRequireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.passwordRequireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  // Check for common weak patterns
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
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
 * Use for form inputs and user-generated content
 * Uses DOMPurify for comprehensive sanitization while preserving safe content
 */
export function sanitizeInput(input: string): string {
  // Use DOMPurify for comprehensive sanitization
  // Strip all HTML tags but keep the text content
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  // Additional safety: trim and limit length
  return cleaned.trim().slice(0, 1000);
}

/**
 * HTML sanitization to prevent XSS attacks when rendering HTML content
 * Use when displaying any HTML content that may contain user input
 */
export function sanitizeHtml(html: string): string {
  // Configure DOMPurify for maximum security
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'a',
      'img',
      'div',
      'span',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false,
  });

  return clean;
}

/**
 * Escape HTML entities for safe display
 * Use for displaying plain text that should not be interpreted as HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] ?? char);
}

/**
 * Generate a secure session token
 * Requires Web Crypto API for security - no fallback to insecure methods
 */
export function generateSessionToken(): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error(
      'Web Crypto API is not available. Secure token generation requires a modern browser environment.',
    );
  }

  const array = new Uint8Array(32);
  cryptoObj.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// SessionManager class has been removed - use Supabase Auth for all session management
// Sessions are managed securely by Supabase with httpOnly cookies
// Use supabase.auth.getSession(), supabase.auth.signOut(), etc.

/**
 * Validate file magic numbers (file signatures) for security
 * Checks the actual file content, not just the MIME type which can be spoofed
 */
async function validateFileMagicNumber(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Define magic numbers for allowed file types
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [
      [0xff, 0xd8, 0xff], // JPEG/JFIF
    ],
    'image/png': [
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
    ],
    'image/gif': [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    'image/webp': [
      // RIFF....WEBP
      [0x52, 0x49, 0x46, 0x46],
    ],
  };

  // Special handling for WebP (checks RIFF header and WEBP at offset 8)
  if (file.type === 'image/webp') {
    const riffHeader = Array.from(bytes.slice(0, 4));
    const webpSignature = Array.from(bytes.slice(8, 12));
    return (
      riffHeader.every((byte, i) => byte === signatures['image/webp'][0][i]) &&
      webpSignature.every((byte, i) => byte === [0x57, 0x45, 0x42, 0x50][i])
    );
  }

  // Check if file matches any valid signature for its type
  const validSignatures = signatures[file.type];
  if (!validSignatures) {
    return false;
  }

  return validSignatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte),
  );
}

/**
 * Content Security Policy helpers
 */
export async function validateFileUpload(file: File): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }

  // Validate magic numbers (file signature) for security
  // This prevents malicious files with spoofed MIME types
  if (errors.length === 0) {
    try {
      const isValidMagicNumber = await validateFileMagicNumber(file);
      if (!isValidMagicNumber) {
        errors.push(
          'File content does not match its type. The file may be corrupted or misidentified.',
        );
      }
    } catch {
      errors.push('Unable to validate file content');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Audit logging for security events
 * Used by multiple security modules including supportSecurity
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
    // Error-level security events are logged internally for development monitoring
  }

  private static sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
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
