/**
 * Centralized Security Configuration
 * Defines security headers, policies, and configurations for the application
 */

import { logWarning } from '@/lib/errorHandler';

/**
 * Content Security Policy directives
 * Helps prevent XSS attacks by specifying allowed content sources
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React development
    'https://cdn.jsdelivr.net', // For third-party libraries if needed
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for inline styles
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'blob:', // For blob URLs
    'https:', // Allow HTTPS images
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co', // Supabase API
    'https://*.supabase.in', // Supabase realtime
    'wss://*.supabase.co', // WebSocket connections
    'https://api.stripe.com', // Stripe API
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': [
    "'self'",
    'https://checkout.stripe.com', // Stripe checkout
    'https://js.stripe.com', // Stripe.js
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 * These should be set by the server or deployment platform
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Normalize URL to origin (protocol + host + port)
 */
function normalizeUrlToOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return undefined;
  }
}

/**
 * Allowed origins for CORS
 * Strict allowlist of trusted domains
 */
export const ALLOWED_ORIGINS = [
  // Development
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Production (will be replaced with actual domain)
  ((): string | undefined => {
    const appUrl = import.meta.env.VITE_APP_URL as string | undefined;
    if (!appUrl) {
      if (import.meta.env.PROD) {
        logWarning(
          'VITE_APP_URL is not set in production environment. CORS validation may fail for production origin.',
          { component: 'securityConfig', action: 'ALLOWED_ORIGINS_INIT' },
        );
      }
      return undefined;
    }
    // Normalize URL to origin only
    return normalizeUrlToOrigin(appUrl);
  })(),
  // Supabase
  'https://kboefdqxbsdkmnmjosjx.supabase.co',
  // Stripe
  'https://checkout.stripe.com',
  'https://js.stripe.com',
].filter((origin): origin is string => Boolean(origin)); // Type-safe filter

/**
 * CORS configuration
 */
export const CORS_CONFIG = {
  allowedOrigins: ALLOWED_ORIGINS,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Cookie security configuration
 */
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max auth attempts per window
  },
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max reset requests per hour
  },
  // File upload
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max uploads per hour
  },
};

/**
 * Input validation rules
 */
export const INPUT_VALIDATION = {
  email: {
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  name: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
  },
};

/**
 * File upload security configuration
 */
export const FILE_UPLOAD_CONFIG = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  scanForVirus: true, // Enable virus scanning if available
};

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  timeout: 60 * 60 * 1000, // 1 hour
  extendOnActivity: true,
  warningTime: 5 * 60 * 1000, // Warn 5 minutes before timeout
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours max
};

/**
 * Encryption configuration
 */
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  saltLength: 32,
  tagLength: 16,
};

/**
 * Security monitoring configuration
 */
export const MONITORING_CONFIG = {
  logLevel: import.meta.env.PROD ? 'error' : 'debug',
  enableAuditLog: true,
  enableSecurityAlerts: true,
  alertThresholds: {
    failedLogins: 5,
    suspiciousActivity: 3,
    rateLimit: 10,
  },
  retentionDays: 90,
};

/**
 * Compliance configuration
 */
export const COMPLIANCE_CONFIG = {
  gdpr: {
    enabled: true,
    dataRetentionDays: 365,
    allowDataExport: true,
    allowDataDeletion: true,
  },
  ccpa: {
    enabled: true,
    optOutEnabled: true,
  },
  pci: {
    enabled: false, // Handled by Stripe
    tokenization: true,
  },
};

/**
 * Check if running in secure context
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext ?? window.location.protocol === 'https:';
}

/**
 * Validate origin for CORS
 */
export function isAllowedOrigin(origin: string): boolean {
  // Strict checking against allowlist
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Sanitize HTML content to prevent XSS
 * @deprecated Use escapeHtml or sanitizeHtml from @/lib/security instead
 */
export function sanitizeHTML(html: string): string {
  // This function now escapes HTML entities for safety
  // Use escapeHtml from @/lib/security for new code
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return html.replace(/[&<>"'/]/g, (char) => map[char] ?? char);
}

/**
 * Check for common SQL injection patterns
 */
export function hasSQLInjectionPattern(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /'.*\bOR\b.*'/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Security initialization function
 * Should be called on app startup
 */
export function initializeSecurity(): void {
  // Check for secure context
  if (!isSecureContext() && import.meta.env.PROD) {
    logWarning('Application is not running in a secure context (HTTPS)', {
      component: 'securityConfig',
      action: 'SECURITY_INITIALIZATION',
    });
  }

  // Set up CSP meta tag if not set by server
  if (typeof document !== 'undefined') {
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = generateCSPHeader();
      document.head.appendChild(meta);
    }
  }

  // Disable right-click in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      // Allow right-click on input fields
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
    });
  }

  // Set up beforeunload handler for unsaved changes
  window.addEventListener('beforeunload', (e) => {
    // Check for unsaved changes
    const hasUnsavedChanges = sessionStorage.getItem('hasUnsavedChanges') === 'true';
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
