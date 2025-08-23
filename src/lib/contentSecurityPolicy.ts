/**
 * Content Security Policy configuration for enhanced XSS protection
 * This provides defense-in-depth against XSS attacks
 */

export interface CSPConfig {
  directives: Record<string, string[]>;
  reportUri?: string;
}

/**
 * Generate CSP header string from configuration
 */
export const generateCSPHeader = (config: CSPConfig): string => {
  const directives = Object.entries(config.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  if (config.reportUri) {
    return `${directives}; report-uri ${config.reportUri}`;
  }

  return directives;
};

/**
 * Production CSP configuration
 * Strict policy that prevents inline scripts and styles
 */
export const productionCSP: CSPConfig = {
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://cdn.jsdelivr.net', // For DOMPurify CDN fallback
      // Note: Nonces for legitimate inline scripts will be added dynamically
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      'https://fonts.googleapis.com', // For Google Fonts
    ],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'media-src': ["'self'", 'https://*.public.blob.vercel-storage.com'],
    'connect-src': [
      "'self'",
      // Will be dynamically set to specific Supabase project URL via environment
    ],
    // Note: frame-ancestors removed as it cannot be set via meta tag
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Development CSP configuration
 * Less strict for development convenience but still secure
 */
export const developmentCSP: CSPConfig = {
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Needed for Vite development
      "'unsafe-eval'", // Required for Vite HMR in development
      'https://cdn.jsdelivr.net',
      'http://localhost:*',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Added Google Fonts
    'img-src': ["'self'", 'data:', 'https:', 'http:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'], // Added Google Fonts
    'media-src': ["'self'", 'https://*.public.blob.vercel-storage.com'], // Added for audio
    'connect-src': [
      "'self'",
      // Will be dynamically set to specific Supabase project URL via environment
      'ws://localhost:*', // Vite HMR WebSocket
      'http://localhost:*',
    ],
    // Note: frame-ancestors removed as it cannot be set via meta tag
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  },
};

/**
 * Get Supabase URL from environment and validate it
 */
const getSupabaseURL = (): string[] => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    // VITE_SUPABASE_URL not found, using fallback Supabase domain
    return ['https://*.supabase.co', 'wss://*.supabase.co'];
  }

  try {
    const url = new URL(supabaseUrl);
    const httpsUrl = `https://${url.hostname}`;
    const wssUrl = `wss://${url.hostname}`;
    return [httpsUrl, wssUrl];
  } catch {
    // Invalid VITE_SUPABASE_URL, using fallback
    return ['https://*.supabase.co', 'wss://*.supabase.co'];
  }
};

/**
 * Apply CSP to the document with dynamic configuration
 * This should be called early in the application initialization
 */
export const applyCSP = (nonce?: string): void => {
  const isDevelopment = import.meta.env.DEV;
  const baseCsp = isDevelopment ? developmentCSP : productionCSP;

  // Clone the CSP configuration to avoid mutating the original
  const csp: CSPConfig = {
    directives: { ...baseCsp.directives },
    reportUri: baseCsp.reportUri,
  };

  // Add specific Supabase URLs
  const supabaseUrls = getSupabaseURL();
  if (csp.directives['connect-src']) {
    csp.directives['connect-src'] = [...csp.directives['connect-src'], ...supabaseUrls];
  }

  // Add nonce to production script-src if provided
  if (!isDevelopment && nonce && csp.directives['script-src']) {
    csp.directives['script-src'] = [...csp.directives['script-src'], `'nonce-${nonce}'`];
  }

  const cspHeader = generateCSPHeader(csp);

  // Remove any existing CSP meta tags
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Create and append meta tag for CSP
  const metaTag = document.createElement('meta');
  metaTag.httpEquiv = 'Content-Security-Policy';
  metaTag.content = cspHeader;
  document.head.appendChild(metaTag);
};

/**
 * Generate a cryptographically secure nonce for inline scripts
 * This provides additional security for legitimate inline scripts
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(32); // Increased to 32 bytes for better security
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, (char) => {
    switch (char) {
      case '+':
        return '-';
      case '/':
        return '_';
      case '=':
        return '';
      default:
        return char;
    }
  });
};

/**
 * Create a script element with the given nonce
 * This ensures inline scripts are properly nonce-protected
 */
export const createNoncedScript = (content: string, nonce: string): HTMLScriptElement => {
  const script = document.createElement('script');
  script.textContent = content;
  script.nonce = nonce;
  return script;
};

/**
 * Apply CSP with nonce generation for production use
 * This is the recommended way to apply CSP with proper nonce handling
 */
export const applyCSPWithNonce = (): string => {
  const nonce = generateNonce();
  applyCSP(nonce);
  return nonce;
};
