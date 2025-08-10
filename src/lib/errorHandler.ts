// Centralized error handling service for robust production error management
// This service provides structured error logging, user-friendly error messages,
// and security-conscious error reporting for the AI for Elders platform

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

export type ErrorHandler = (error: ErrorReport) => void;

class ErrorHandlerService {
  private readonly handlers: ErrorHandler[] = [];
  private readonly isProduction = import.meta.env.MODE === 'production';

  constructor() {
    // Add default console handler for development
    if (!this.isProduction) {
      this.addHandler(this.consoleHandler);
    }

    // Handle uncaught errors globally
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'error',
        this.handleGlobalError.bind(this) as (
          this: Window,
          ev: ErrorEvent,
        ) => unknown,
      );
      window.addEventListener(
        'unhandledrejection',
        this.handleUnhandledRejection.bind(this) as (
          this: Window,
          ev: PromiseRejectionEvent,
        ) => unknown,
      );
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeError(error: Error): { message: string; stack?: string } {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/gi,
      /token/gi,
      /key/gi,
      /secret/gi,
      /api[_-]?key/gi,
      /auth[_-]?token/gi,
    ];

    let message = error.message;
    let stack = error.stack;

    sensitivePatterns.forEach((pattern) => {
      message = message.replace(pattern, '[REDACTED]');
      if (stack) {
        stack = stack.replace(pattern, '[REDACTED]');
      }
    });

    return { message, stack };
  }

  private readonly consoleHandler: ErrorHandler = (
    report: ErrorReport,
  ): void => {
    const logLevel =
      report.level === 'error'
        ? 'error'
        : report.level === 'warning'
          ? 'warn'
          : 'info';
    console[logLevel](`[ErrorHandler] ${report.message}`, {
      id: report.id,
      context: report.context,
      originalError: report.originalError,
    });
  };

  private handleGlobalError(event: ErrorEvent): void {
    this.logError('Global JavaScript error', event.error as Error | undefined, {
      component: 'window',
      action: 'global_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.logError(
      'Unhandled Promise rejection',
      event.reason as Error | undefined,
      {
        component: 'window',
        action: 'unhandled_rejection',
      },
    );
  }

  public addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  public removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  public logError(
    message: string,
    error?: Error,
    context?: ErrorContext,
    level: 'error' | 'warning' | 'info' = 'error',
  ): string {
    const errorId = this.generateErrorId();
    let sanitizedError: { message: string; stack?: string } | undefined;

    if (error instanceof Error) {
      sanitizedError = this.sanitizeError(error);
    }

    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      level,
      message,
      originalError: error,
      context,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      stackTrace: sanitizedError?.stack,
    };

    // Notify all handlers
    this.handlers.forEach((handler) => {
      try {
        handler(report);
      } catch (handlerError) {
        // Prevent infinite loops - log handler errors to console only
        console.error('Error handler failed:', handlerError);
      }
    });

    return errorId;
  }

  public logWarning(message: string, context?: ErrorContext): string {
    return this.logError(message, undefined, context, 'warning');
  }

  public logInfo(message: string, context?: ErrorContext): string {
    return this.logError(message, undefined, context, 'info');
  }

  // Database operation error handling
  public handleDatabaseError(
    operation: string,
    error: Error,
    context?: Omit<ErrorContext, 'action'>,
  ): string {
    return this.logError(`Database operation failed: ${operation}`, error, {
      ...context,
      action: 'database_operation',
    });
  }

  // Authentication error handling
  public handleAuthError(
    operation: string,
    error: Error,
    context?: Omit<ErrorContext, 'component' | 'action'>,
  ): string {
    return this.logError(`Authentication failed: ${operation}`, error, {
      ...context,
      component: 'auth',
      action: operation,
    });
  }

  // Payment/subscription error handling
  public handlePaymentError(
    operation: string,
    error: Error,
    context?: Omit<ErrorContext, 'component' | 'action'>,
  ): string {
    return this.logError(`Payment operation failed: ${operation}`, error, {
      ...context,
      component: 'payment',
      action: operation,
    });
  }

  // Storage error handling
  public handleStorageError(
    operation: string,
    error: Error,
    context?: Omit<ErrorContext, 'component' | 'action'>,
  ): string {
    return this.logError(`Storage operation failed: ${operation}`, error, {
      ...context,
      component: 'storage',
      action: operation,
    });
  }

  // API error handling
  public handleApiError(
    endpoint: string,
    error: Error,
    context?: Omit<ErrorContext, 'component' | 'action'>,
  ): string {
    return this.logError(`API request failed: ${endpoint}`, error, {
      ...context,
      component: 'api',
      action: 'request',
    });
  }

  // Get user-friendly error messages for UI display
  public getUserFriendlyMessage(_errorId: string, fallback?: string): string {
    // In a real implementation, this could lookup specific error IDs
    // For now, return generic senior-friendly messages
    const genericMessages = [
      "Something went wrong, but we're working on it. Please try again in a moment.",
      'We encountered a temporary issue. Your progress has been saved.',
      'There was a technical difficulty. Please refresh the page and try again.',
      "We're having trouble connecting right now. Please check your internet connection.",
    ];

    return (
      fallback ??
      genericMessages[Math.floor(Math.random() * genericMessages.length)]
    );
  }

  // Check if we're in a development environment
  public isDevelopment(): boolean {
    return !this.isProduction;
  }

  // Health check for error handling system
  public healthCheck(): { healthy: boolean; handlersCount: number } {
    return {
      healthy: this.handlers.length > 0,
      handlersCount: this.handlers.length,
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();

// Convenience functions for common error patterns
export function logError(
  message: string,
  error?: Error,
  context?: ErrorContext,
): string {
  return errorHandler.logError(message, error, context);
}

export function logWarning(message: string, context?: ErrorContext): string {
  return errorHandler.logWarning(message, context);
}

export function logInfo(message: string, context?: ErrorContext): string {
  return errorHandler.logInfo(message, context);
}

// Helper for wrapping async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    component: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ success: true; data: T } | { success: false; errorId: string }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const errorId = errorHandler.logError(
      `Operation failed: ${context.operationName}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        component: context.component,
        action: context.operationName,
        userId: context.userId,
        metadata: context.metadata,
      },
    );
    return { success: false, errorId };
  }
}

// Helper for wrapping sync operations with error handling
export function withSyncErrorHandling<T>(
  operation: () => T,
  context: {
    operationName: string;
    component: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  },
): { success: true; data: T } | { success: false; errorId: string } {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    const errorId = errorHandler.logError(
      `Operation failed: ${context.operationName}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        component: context.component,
        action: context.operationName,
        userId: context.userId,
        metadata: context.metadata,
      },
    );
    return { success: false, errorId };
  }
}
