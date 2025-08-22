/**
 * Centralized logging utility for production-safe console output
 * Prevents sensitive information leakage in production environments
 */

// Note: errorHandler is not imported here to avoid circular dependency
// Error tracking is handled internally in this module

// Log levels for the logger (kept for potential future use)

interface LogOptions {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private readonly isDevelopment: boolean;
  private readonly isDebugEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    // Enable debug logging in development or if explicitly enabled via localStorage
    this.isDebugEnabled = this.isDevelopment || localStorage.getItem('debug') === 'true';
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, options?: LogOptions): void {
    if (this.isDebugEnabled) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG]`, message, options);
    }
  }

  /**
   * Log general information
   */
  info(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[INFO]`, message, options);
    }
    // In production, could send to analytics service
  }

  /**
   * Log warnings
   */
  warn(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN]`, message, options);
    } else {
      // In production, send to error tracking service without exposing to console
      this.sendToErrorTracking('warning', message, options);
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR]`, message, error, options);
    } else {
      // In production, send to error tracking service
      this.sendToErrorTracking('error', message, {
        ...options,
        metadata: {
          ...options?.metadata,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit = 'ms'): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[PERF] ${metric}: ${value}${unit}`);
    }
    // In production, could send to analytics service
  }

  /**
   * Create a child logger with a specific component context
   */
  child(component: string): ComponentLogger {
    return new ComponentLogger(component, this);
  }

  /**
   * Send logs to error tracking service in production
   */
  private sendToErrorTracking(level: string, message: string, options?: LogOptions): void {
    // This would integrate with your error tracking service (Sentry, etc.)
    // For now, we'll store in a buffer that could be sent periodically
    const errorLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: options?.component,
      action: options?.action,
      metadata: options?.metadata,
    };

    // Store in session storage for potential debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('errorLogs') ?? '[]') as unknown[];
      logs.push(errorLog);
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift();
      }
      sessionStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch {
      // Silently fail if storage is full or unavailable
    }
  }
}

/**
 * Component-specific logger with context
 */
class ComponentLogger {
  constructor(
    private readonly component: string,
    private readonly parent: Logger,
  ) {}

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.parent.debug(message, { component: this.component, metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.parent.info(message, { component: this.component, metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.parent.warn(message, { component: this.component, metadata });
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.parent.error(message, error, { component: this.component, metadata });
  }

  performance(metric: string, value: number, unit = 'ms'): void {
    this.parent.performance(`${this.component}.${metric}`, value, unit);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for component loggers
export type { ComponentLogger };

/**
 * Utility to replace console methods globally
 * Call this at app initialization to ensure all console logs go through the logger
 */
export function replaceConsoleInProduction(): void {
  if (import.meta.env.PROD) {
    // Store original console methods for internal use

    const originalConsole = {
      // eslint-disable-next-line no-console
      log: console.log,
      // eslint-disable-next-line no-console
      debug: console.debug,
      // eslint-disable-next-line no-console
      info: console.info,
      // eslint-disable-next-line no-console
      warn: console.warn,
      // eslint-disable-next-line no-console
      error: console.error,
    };

    // Replace console methods
    // eslint-disable-next-line no-console
    console.log = (...args: unknown[]): void => {
      logger.info(args.map((arg) => String(arg)).join(' '));
    };

    // eslint-disable-next-line no-console
    console.debug = (...args: unknown[]): void => {
      logger.debug(args.map((arg) => String(arg)).join(' '));
    };

    // eslint-disable-next-line no-console
    console.info = (...args: unknown[]): void => {
      logger.info(args.map((arg) => String(arg)).join(' '));
    };

    // eslint-disable-next-line no-console
    console.warn = (...args: unknown[]): void => {
      logger.warn(args.map((arg) => String(arg)).join(' '));
    };

    // eslint-disable-next-line no-console
    console.error = (...args: unknown[]): void => {
      const message = args[0] ? String(args[0]) : 'Console error';
      const error = args[1] instanceof Error ? args[1] : undefined;
      logger.error(message, error);
    };

    // Store originals for debugging if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (globalThis as any).__originalConsole = originalConsole;
  }
}
