/**
 * Comprehensive Error Handling System
 * Provides global error management, logging, and recovery mechanisms
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  context: ErrorContext;
  correlationId: string;
  resolved: boolean;
  retryCount: number;
  lastRetry?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export class ErrorHandler {
  private errorLogs: Map<string, ErrorLog> = new Map();
  private retryConfig: RetryConfig;
  private correlationId: string = '';

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = {
      maxAttempts: retryConfig.maxAttempts || 3,
      baseDelay: retryConfig.baseDelay || 1000,
      maxDelay: retryConfig.maxDelay || 30000,
      backoffMultiplier: retryConfig.backoffMultiplier || 2,
      retryableErrors: retryConfig.retryableErrors || [
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMIT',
        'SERVICE_UNAVAILABLE',
        'DATABASE_CONNECTION_ERROR',
      ],
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * Handle and log an error with context
   */
  async handleError(
    error: Error,
    context: ErrorContext = {},
    options: {
      retry?: boolean;
      fallback?: () => Promise<any>;
      notify?: boolean;
    } = {}
  ): Promise<ErrorLog> {
    const errorId = this.generateErrorId();
    const correlationId = this.getCorrelationId();

    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        correlationId,
      },
      correlationId,
      resolved: false,
      retryCount: 0,
    };

    // Store error log
    this.errorLogs.set(errorId, errorLog);

    // Log to console (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', {
        id: errorId,
        message: error.message,
        context,
        stack: error.stack,
      });
    }

    // Send to external logging service
    await this.sendToLoggingService(errorLog);

    // Retry logic
    if (options.retry && this.isRetryableError(error)) {
      return this.scheduleRetry(errorLog, options.fallback);
    }

    // Notify if requested
    if (options.notify) {
      await this.notifyError(errorLog);
    }

    return errorLog;
  }

  /**
   * Execute a function with automatic error handling and retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    options: {
      fallback?: () => Promise<T>;
      notify?: boolean;
    } = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Handle the error
        const errorLog = await this.handleError(error, {
          ...context,
          attempt,
        }, {
          retry: attempt < this.retryConfig.maxAttempts,
          fallback: options.fallback,
          notify: options.notify,
        });

        // If this is the last attempt, try fallback or throw
        if (attempt === this.retryConfig.maxAttempts) {
          if (options.fallback) {
            try {
              return await options.fallback();
            } catch (fallbackError) {
              await this.handleError(fallbackError, {
                ...context,
                attempt: 'fallback',
              });
              throw fallbackError;
            }
          }
          throw error;
        }

        // Wait before retry
        const delay = this.calculateRetryDelay(attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Create an error boundary for React components
   */
  createErrorBoundary() {
    return class ErrorBoundary extends React.Component<
      { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
      { hasError: boolean; error: Error | null }
    > {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.handleError(error, {
          component: errorInfo.componentStack,
          action: 'component_did_catch',
        });
      }

      render() {
        if (this.state.hasError) {
          const FallbackComponent = this.props.fallback || DefaultErrorFallback;
          return <FallbackComponent error={this.state.error!} />;
        }

        return this.props.children;
      }

      private async handleError(error: Error, context: ErrorContext) {
        await ErrorHandler.getInstance().handleError(error, context, {
          notify: true,
        });
      }
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByLevel: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: ErrorLog[];
  } {
    const errors = Array.from(this.errorLogs.values());
    const recentErrors = errors
      .filter(error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const errorsByLevel = errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByComponent = errors.reduce((acc, error) => {
      const component = error.context.component || 'unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      unresolvedErrors: errors.filter(error => !error.resolved).length,
      errorsByLevel,
      errorsByComponent,
      recentErrors,
    };
  }

  /**
   * Mark an error as resolved
   */
  markErrorResolved(errorId: string): void {
    const error = this.errorLogs.get(errorId);
    if (error) {
      error.resolved = true;
      this.errorLogs.set(errorId, error);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      await this.handleError(error, {
        component: 'process',
        action: 'uncaught_exception',
      }, {
        notify: true,
      });
      
      // Exit process after handling
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await this.handleError(error, {
        component: 'process',
        action: 'unhandled_rejection',
        metadata: { promise: promise.toString() },
      }, {
        notify: true,
      });
    });

    // Handle window errors (browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('error', async (event) => {
        await this.handleError(new Error(event.message), {
          component: 'window',
          action: 'error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', async (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        await this.handleError(error, {
          component: 'window',
          action: 'unhandled_rejection',
        });
      });
    }
  }

  private async scheduleRetry(errorLog: ErrorLog, fallback?: () => Promise<any>): Promise<ErrorLog> {
    const delay = this.calculateRetryDelay(errorLog.retryCount + 1);
    
    setTimeout(async () => {
      try {
        // This would contain the retry logic
        // For now, we'll just update the retry count
        errorLog.retryCount++;
        errorLog.lastRetry = Date.now();
        this.errorLogs.set(errorLog.id, errorLog);
      } catch (error) {
        // If retry fails, try fallback
        if (fallback) {
          try {
            await fallback();
          } catch (fallbackError) {
            await this.handleError(fallbackError, errorLog.context);
          }
        }
      }
    }, delay);

    return errorLog;
  }

  private isRetryableError(error: Error): boolean {
    return this.retryConfig.retryableErrors.some(retryableError =>
      error.message.includes(retryableError) || error.name.includes(retryableError)
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private async sendToLoggingService(errorLog: ErrorLog): Promise<void> {
    // This would integrate with your logging service (e.g., Sentry, LogRocket, etc.)
    if (process.env.SENTRY_DSN) {
      // Send to Sentry
      console.log('Sending error to Sentry:', errorLog.id);
    }
    
    // Send to custom logging endpoint
    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      });
    } catch (error) {
      console.error('Failed to send error to logging service:', error);
    }
  }

  private async notifyError(errorLog: ErrorLog): Promise<void> {
    // This would integrate with your notification service (e.g., Slack, email, etc.)
    console.log('Notifying about error:', errorLog.id);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private getCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return this.correlationId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Singleton pattern
  private static instance: ErrorHandler | null = null;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="error-boundary">
    <h2>Something went wrong</h2>
    <p>We're sorry, but something unexpected happened.</p>
    {process.env.NODE_ENV === 'development' && (
      <details>
        <summary>Error details</summary>
        <pre>{error.stack}</pre>
      </details>
    )}
    <button onClick={() => window.location.reload()}>
      Reload page
    </button>
  </div>
);

export default ErrorHandler;
