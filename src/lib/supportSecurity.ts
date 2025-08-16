/**
 * Security utilities for email support system
 * Provides rate limiting, input validation, spam detection, and audit logging
 * Following PASSWORD_SECURITY.md patterns and existing security.ts architecture
 */

import createDOMPurify from 'dompurify';
// Create a DOMPurify instance only in browser environments
const DOMPurifyInstance =
  typeof window !== 'undefined' ? createDOMPurify(window as unknown as Window) : null;

import type { SupabaseClient } from '@supabase/supabase-js';
import { SecurityLogger } from './security';
// Type definitions for support security
export interface SupportRateLimitConfig {
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
  maxMessageLength: number;
  minMessageLength: number;
  cooldownMinutes: number;
}

export interface SupportSecurityError {
  code: 'RATE_LIMITED' | 'INVALID_INPUT' | 'SPAM_DETECTED' | 'SESSION_INVALID' | 'UNAUTHORIZED';
  message: string;
  details?: {
    remainingTime?: number; // in minutes
    attemptsRemaining?: number;
    validationErrors?: string[];
  };
}

export interface SupportValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedMessage?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

// Default configuration for support rate limiting
export const defaultSupportConfig: SupportRateLimitConfig = {
  maxEmailsPerHour: 3,
  maxEmailsPerDay: 10,
  maxMessageLength: 2000,
  minMessageLength: 10,
  cooldownMinutes: 20,
};

/**
 * Rate limiter specifically for support emails
 * Tracks both hourly and daily limits per user
 */
export class SupportRateLimiter {
  private readonly attempts: Map<
    string,
    {
      hourlyCount: number;
      dailyCount: number;
      lastAttempt: number;
      blockedUntil?: number;
      messages: string[]; // Track recent messages for duplicate detection
    }
  > = new Map();

  constructor(private readonly config = defaultSupportConfig) {}

  /**
   * Check if user can send a support email
   */
  canSendEmail(userId: string): {
    allowed: boolean;
    error?: SupportSecurityError;
    attemptsRemaining?: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(userId);

    // First time user
    if (!record) {
      return { allowed: true, attemptsRemaining: this.config.maxEmailsPerHour };
    }

    // Check if blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 1000 / 60);
      return {
        allowed: false,
        error: {
          code: 'RATE_LIMITED',
          message: `You've sent too many support emails. Please wait ${remainingMinutes} minutes before trying again.`,
          details: {
            remainingTime: remainingMinutes,
          },
        },
      };
    }

    // Reset hourly counter if needed
    const oneHourAgo = now - 60 * 60 * 1000;
    if (record.lastAttempt < oneHourAgo) {
      record.hourlyCount = 0;
    }

    // Reset daily counter if needed
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    if (record.lastAttempt < oneDayAgo) {
      record.dailyCount = 0;
      record.hourlyCount = 0;
      record.messages = [];
    }

    // Check hourly limit
    if (record.hourlyCount >= this.config.maxEmailsPerHour) {
      const timeSinceLastAttempt = now - record.lastAttempt;
      const remainingMinutes = Math.ceil((60 * 60 * 1000 - timeSinceLastAttempt) / 1000 / 60);
      return {
        allowed: false,
        error: {
          code: 'RATE_LIMITED',
          message: `You can only send ${this.config.maxEmailsPerHour} support emails per hour. Please wait ${remainingMinutes} minutes.`,
          details: {
            remainingTime: remainingMinutes,
            attemptsRemaining: 0,
          },
        },
      };
    }

    // Check daily limit
    if (record.dailyCount >= this.config.maxEmailsPerDay) {
      return {
        allowed: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Daily limit of ${this.config.maxEmailsPerDay} support emails reached. Please try again tomorrow.`,
          details: {
            attemptsRemaining: 0,
          },
        },
      };
    }

    const attemptsRemaining = Math.min(
      this.config.maxEmailsPerHour - record.hourlyCount,
      this.config.maxEmailsPerDay - record.dailyCount,
    );

    return { allowed: true, attemptsRemaining };
  }

  /**
   * Record a support email attempt
   */
  async recordEmailAttempt(userId: string, message: string): Promise<void> {
    const now = Date.now();
    const record = this.attempts.get(userId) ?? {
      hourlyCount: 0,
      dailyCount: 0,
      lastAttempt: 0,
      messages: [],
    };

    // Reset counters if needed
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    if (record.lastAttempt < oneDayAgo) {
      record.dailyCount = 0;
      record.hourlyCount = 0;
      record.messages = [];
    } else if (record.lastAttempt < oneHourAgo) {
      record.hourlyCount = 0;
    }

    // Increment counters
    record.hourlyCount += 1;
    record.dailyCount += 1;
    record.lastAttempt = now;

    // Store message hash for duplicate detection (keep last 10)
    const messageHash = await this.hashMessage(message);
    record.messages.push(messageHash);
    if (record.messages.length > 10) {
      record.messages = record.messages.slice(-10);
    }

    // Apply cooldown if hitting limits
    if (
      record.hourlyCount >= this.config.maxEmailsPerHour ||
      record.dailyCount >= this.config.maxEmailsPerDay
    ) {
      record.blockedUntil = now + this.config.cooldownMinutes * 60 * 1000;
    }

    this.attempts.set(userId, record);

    // Log the attempt for audit purposes
    SecurityLogger.log('support_email_attempt', { userId, messageLength: message.length }, 'info');
  }

  /**
   * Check if a message is a duplicate of recent messages
   */
  async isDuplicateMessage(userId: string, message: string): Promise<boolean> {
    const record = this.attempts.get(userId);
    if (!record || record.messages.length === 0) {
      return false;
    }

    const messageHash = await this.hashMessage(message);
    return record.messages.includes(messageHash);
  }

  /**
   * Efficient hash function for message comparison
   */
  private async hashMessage(message: string): Promise<string> {
    // Strip HTML tags and normalize whitespace for semantic comparison
    const str = message
      .toLowerCase()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize spaces/tabs
      .trim();

    // Use Web Crypto API for efficient hashing (available in modern browsers)
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 16);
      } catch (error) {
        SecurityLogger.log(
          'crypto_digest_fallback',
          { error: String(error) },
          'warning',
        );
      }
    }

    // Fallback to simple hash for Node.js or if Crypto API fails
    let hash = 0;
    // For long messages, sample instead of processing everything
    const sampleSize = Math.min(str.length, 1000);
    const step = Math.max(1, Math.floor(str.length / sampleSize));

    for (let i = 0; i < str.length; i += step) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear rate limit data for a user (admin use)
   */
  clearUserLimits(userId: string): void {
    this.attempts.delete(userId);
    SecurityLogger.log('support_limits_cleared', { userId }, 'warning');
  }

  /**
   * Get current rate limit status for a user
   */
  getStatus(userId: string): {
    hourlyCount: number;
    dailyCount: number;
    attemptsRemaining: number;
    isBlocked: boolean;
    blockedUntilTime?: number;
  } {
    const record = this.attempts.get(userId);
    if (!record) {
      return {
        hourlyCount: 0,
        dailyCount: 0,
        attemptsRemaining: this.config.maxEmailsPerHour,
        isBlocked: false,
      };
    }

    const now = Date.now();
    const isBlocked = !!(record.blockedUntil && now < record.blockedUntil);

    return {
      hourlyCount: record.hourlyCount,
      dailyCount: record.dailyCount,
      attemptsRemaining: Math.min(
        this.config.maxEmailsPerHour - record.hourlyCount,
        this.config.maxEmailsPerDay - record.dailyCount,
      ),
      isBlocked,
      blockedUntilTime: record.blockedUntil,
    };
  }
}

/**
 * Support message validation and sanitization
 */
export class SupportMessageValidator {
  private readonly config: SupportRateLimitConfig;
  private readonly spamPatterns: RegExp[] = [
    /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
    /\b(click here|act now|limited time|urgent|immediate action)\b/i,
    /\b\d{10,}\b/, // Long number sequences (potential credit cards/SSNs)
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN patterns
  ];

  private readonly piiPatterns: RegExp[] = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, // Credit card
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b[A-Z0-9]{10,}\b/g, // Potential account numbers
    /(http|https):\/\/[^\s]+/gi, // URLs (redact for safety)
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email addresses (redact for safety)
  ];

  constructor(config = defaultSupportConfig) {
    this.config = config;
  }

  /**
   * Validate and sanitize a support message
   */
  validateMessage(message: string): SupportValidationResult {
    const errors: string[] = [];

    // Check message length
    if (!message || message.trim().length < this.config.minMessageLength) {
      errors.push(`Message must be at least ${this.config.minMessageLength} characters long`);
    }

    if (message.length > this.config.maxMessageLength) {
      errors.push(`Message must be less than ${this.config.maxMessageLength} characters`);
    }

    // Check for spam patterns
    const spamDetected = this.detectSpam(message);
    if (spamDetected) {
      errors.push('Your message was flagged as potential spam. Please revise and try again.');
      SecurityLogger.log('spam_detected', { messagePreview: message.substring(0, 50) }, 'warning');
    }

    // Sanitize the message
    const sanitizedMessage = this.sanitizeMessage(message);

    // Check if message was significantly altered (potential attack)
    if (sanitizedMessage.length < message.length * 0.5) {
      errors.push('Message contains too many invalid characters');
      SecurityLogger.log(
        'suspicious_message_content',
        {
          originalLength: message.length,
          sanitizedLength: sanitizedMessage.length,
        },
        'warning',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedMessage: errors.length === 0 ? sanitizedMessage : undefined,
    };
  }

  /**
   * Detect spam patterns in message
   */
  private detectSpam(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Check for spam keywords
    for (const pattern of this.spamPatterns) {
      if (pattern.test(lowerMessage)) {
        return true;
      }
    }

    // Check for excessive capitalization (shouting)
    const upperCount = (message.match(/[A-Z]/g) ?? []).length;
    const letterCount = (message.match(/[a-zA-Z]/g) ?? []).length;
    if (letterCount > 20 && upperCount / letterCount > 0.7) {
      return true;
    }

    // Check for repeated characters (e.g., "!!!!!!!!")
    if (/(.)\1{5,}/g.test(message)) {
      return true;
    }

    return false;
  }

  /**
   * Sanitize message content
   */
  private sanitizeMessage(message: string): string {
    // Remove any PII patterns
    let sanitized = message;
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Use DOMPurify for HTML sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [], // No HTML tags allowed in support messages
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // Trim and normalize whitespace while preserving newlines
    sanitized = sanitized
      .trim()
      .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs only
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines

    return sanitized;
  }

  /**
   * Check for honeypot field (anti-bot measure)
   */
  validateHoneypot(honeypotValue: string): boolean {
    // Honeypot field should be empty (bots will fill it)
    if (honeypotValue && honeypotValue.length > 0) {
      SecurityLogger.log('honeypot_triggered', { valueLength: honeypotValue.length }, 'warning');
      return false;
    }
    return true;
  }
}

/**
 * Session validation for support operations
 */
export class SupportSessionValidator {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Validate current user session for support operations
   */
  async validateSession(csrfToken?: string): Promise<SessionValidationResult> {
    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession();

      if (sessionError || !session) {
        return {
          isValid: false,
          error: 'Please sign in to send a support message',
        };
      }

      // CSRF Token validation (if provided)
      if (csrfToken) {
        // Simple CSRF validation - in production, validate against server-stored token
        const isValidCsrf = /^[a-zA-Z0-9]{32,}$/.test(csrfToken);
        if (!isValidCsrf) {
          SecurityLogger.log('csrf_validation_failed', { userId: session.user.id }, 'warning');
          return {
            isValid: false,
            error: 'Invalid request token. Please refresh the page and try again.',
          };
        }
      }

      // Check if session is about to expire (require reasonably fresh session)
      const now = Date.now();
      const sessionExpiresAt = session.expires_at ? session.expires_at * 1000 : now + 3600000; // expires_at is in seconds
      const timeUntilExpiry = sessionExpiresAt - now;
      const minTimeUntilExpiry = 5 * 60 * 1000; // Require at least 5 minutes until expiry

      if (timeUntilExpiry < minTimeUntilExpiry) {
        SecurityLogger.log('expiring_session_support_attempt', { timeUntilExpiry }, 'warning');
        return {
          isValid: false,
          error: 'Your session is about to expire. Please sign in again.',
        };
      }

      // Get user profile to check for flags
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('is_active, email_verified')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        return {
          isValid: false,
          error: 'Unable to verify your account. Please try again.',
        };
      }

      // Check if user is active
      if (profile.is_active === false) {
        SecurityLogger.log('inactive_user_support_attempt', { userId: session.user.id }, 'warning');
        return {
          isValid: false,
          error: 'Your account has been suspended. Please contact support.',
        };
      }

      // Optionally require email verification
      if (profile.email_verified === false) {
        return {
          isValid: false,
          error: 'Please verify your email address before sending support messages.',
        };
      }

      return {
        isValid: true,
        userId: session.user.id,
        email: session.user.email,
      };
    } catch (error) {
      SecurityLogger.log('session_validation_error', { error: String(error) }, 'error');
      return {
        isValid: false,
        error: 'An error occurred while validating your session.',
      };
    }
  }

  /**
   * Refresh session if needed
   */
  async refreshSession(): Promise<boolean> {
    try {
      const { error } = await this.supabase.auth.refreshSession();
      if (error) {
        SecurityLogger.log('session_refresh_failed', { error: error.message }, 'error');
        return false;
      }
      return true;
    } catch (error) {
      SecurityLogger.log('session_refresh_error', { error: String(error) }, 'error');
      return false;
    }
  }
}

/**
 * Error normalization for support operations
 */
export function normalizeSupportError(error: unknown): SupportSecurityError {
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase();

    // Rate limiting errors
    if (message.includes('rate') || message.includes('limit')) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a few minutes and try again.',
      };
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized')) {
      return {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to send support messages.',
      };
    }

    // Session errors
    if (message.includes('session') || message.includes('expired')) {
      return {
        code: 'SESSION_INVALID',
        message: 'Your session has expired. Please sign in again.',
      };
    }
  }

  // Default error
  SecurityLogger.log('unknown_support_error', { error: String(error) }, 'error');
  return {
    code: 'INVALID_INPUT',
    message: 'An error occurred while processing your request. Please try again.',
  };
}

/**
 * Sanitize sensitive data from log details
 */
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive words
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
    // Sanitize email addresses (keep domain for debugging)
    else if (typeof value === 'string' && value.includes('@')) {
      const parts = value.split('@');
      if (parts.length === 2) {
        sanitized[key] = `***@${parts[1]}`;
      } else {
        sanitized[key] = '[EMAIL]';
      }
    }
    // Truncate long strings that might contain message content
    else if (typeof value === 'string' && value.length > 100) {
      sanitized[key] = value.substring(0, 100) + '...[truncated]';
    }
    // Recursively sanitize nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Audit logging for support operations with data sanitization
 */
export function logSupportEvent(
  event: 'email_sent' | 'email_blocked' | 'spam_detected' | 'rate_limited',
  details: Record<string, unknown>,
): void {
  const severity = event === 'email_sent' ? 'info' : 'warning';
  const sanitizedDetails = sanitizeLogData(details);
  SecurityLogger.log(`support_${event}`, sanitizedDetails, severity);
}

/**
 * Main support security orchestrator
 */
export class SupportSecurityManager {
  private readonly rateLimiter: SupportRateLimiter;
  private readonly validator: SupportMessageValidator;
  private readonly sessionValidator: SupportSessionValidator;

  constructor(supabase: SupabaseClient, config = defaultSupportConfig) {
    this.rateLimiter = new SupportRateLimiter(config);
    this.validator = new SupportMessageValidator(config);
    this.sessionValidator = new SupportSessionValidator(supabase);
  }

  /**
   * Comprehensive security check before allowing support email
   */
  async canSendSupportEmail(
    message: string,
    honeypotValue = '',
    csrfToken?: string,
  ): Promise<{
    allowed: boolean;
    error?: SupportSecurityError;
    sanitizedMessage?: string;
    userId?: string;
    email?: string;
  }> {
    // 1. Validate session with CSRF token
    const sessionResult = await this.sessionValidator.validateSession(csrfToken);
    if (!sessionResult.isValid) {
      return {
        allowed: false,
        error: {
          code: 'SESSION_INVALID',
          message: sessionResult.error ?? 'Invalid session',
        },
      };
    }

    const userId = sessionResult.userId ?? '';
    const email = sessionResult.email ?? '';

    // 2. Check rate limits
    const rateLimitCheck = this.rateLimiter.canSendEmail(userId);
    if (!rateLimitCheck.allowed) {
      // Log rate limiting event
      SecurityLogger.log(
        'support_rate_limited',
        { userId, error: rateLimitCheck.error },
        'warning',
      );
      return {
        allowed: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Check honeypot
    if (!this.validator.validateHoneypot(honeypotValue)) {
      // Log honeypot triggered event
      SecurityLogger.log(
        'support_honeypot_blocked',
        { userId, honeypotLength: honeypotValue.length },
        'warning',
      );
      return {
        allowed: false,
        error: {
          code: 'SPAM_DETECTED',
          message: 'Your request was blocked. Please try again.',
        },
      };
    }

    // 4. Check for duplicate messages
    if (await this.rateLimiter.isDuplicateMessage(userId, message)) {
      // Log duplicate message blocked event
      SecurityLogger.log(
        'support_duplicate_blocked',
        { userId, messageLength: message.length },
        'warning',
      );
      return {
        allowed: false,
        error: {
          code: 'SPAM_DETECTED',
          message: 'This message appears to be a duplicate. Please send a different message.',
        },
      };
    }

    // 5. Validate and sanitize message
    const validationResult = this.validator.validateMessage(message);
    if (!validationResult.isValid) {
      // Log validation failure event
      SecurityLogger.log(
        'support_validation_failed',
        {
          userId,
          messageLength: message.length,
          errors: validationResult.errors,
        },
        'warning',
      );
      return {
        allowed: false,
        error: {
          code: 'INVALID_INPUT',
          message: validationResult.errors[0] ?? 'Invalid message',
          details: {
            validationErrors: validationResult.errors,
          },
        },
      };
    }

    return {
      allowed: true,
      sanitizedMessage: validationResult.sanitizedMessage,
      userId,
      email,
    };
  }

  /**
   * Record successful email send
   */
  async recordEmailSent(userId: string, message: string): Promise<void> {
    await this.rateLimiter.recordEmailAttempt(userId, message);
    logSupportEvent('email_sent', { userId, messageLength: message.length });
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(userId: string): ReturnType<SupportRateLimiter['getStatus']> {
    return this.rateLimiter.getStatus(userId);
  }

  /**
   * Clear rate limits (admin function)
   */
  clearRateLimits(userId: string): void {
    this.rateLimiter.clearUserLimits(userId);
  }
}

// Export singleton instance for easy use
let supportSecurityInstance: SupportSecurityManager | null = null;

export function getSupportSecurity(supabase: SupabaseClient): SupportSecurityManager {
  supportSecurityInstance ??= new SupportSecurityManager(supabase);
  return supportSecurityInstance;
}
