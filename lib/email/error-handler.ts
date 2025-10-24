import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface ErrorEvent {
  id: string;
  type:
    | 'sendgrid_api'
    | 'template_rendering'
    | 'queue_processing'
    | 'webhook_processing'
    | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, any>;
  created_at: string;
  resolved_at?: string;
  is_resolved: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime?: string;
  nextAttemptTime?: string;
}

export class EmailErrorHandler {
  private supabase = createClient();
  private auditLogger = new AuditLogger();
  private circuitBreakerState: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
  };

  private readonly retryConfigs: Record<string, RetryConfig> = {
    sendgrid_api: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    },
    template_rendering: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
    },
    queue_processing: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 1.5,
    },
    webhook_processing: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    },
    validation: {
      maxRetries: 1,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
    },
  };

  /**
   * Handle email error with retry logic
   */
  async handleError(
    error: Error,
    type: ErrorEvent['type'],
    context: Record<string, any> = {},
    retryFunction?: () => Promise<any>
  ): Promise<any> {
    try {
      // Check circuit breaker
      if (this.circuitBreakerState.isOpen) {
        if (this.shouldAttemptReset()) {
          this.resetCircuitBreaker();
        } else {
          throw new Error(
            'Circuit breaker is open - email service unavailable'
          );
        }
      }

      // Log error
      const errorEvent = await this.logError(error, type, context);

      // Determine if we should retry
      const retryConfig = this.retryConfigs[type];
      const shouldRetry =
        retryConfig && retryFunction && this.shouldRetry(error, type);

      if (shouldRetry) {
        return await this.retryWithBackoff(
          retryFunction!,
          retryConfig,
          errorEvent.id
        );
      } else {
        // Handle non-retryable error
        await this.handleNonRetryableError(errorEvent);
        throw error;
      }
    } catch (error) {
      console.error('Error in error handler:', error);
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff(
    retryFunction: () => Promise<any>,
    config: RetryConfig,
    errorEventId: string
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        if (attempt > 1) {
          await this.sleep(delay);
        }

        // Attempt the operation
        const result = await retryFunction();

        // Success - reset circuit breaker and resolve error
        this.resetCircuitBreaker();
        await this.resolveError(errorEventId);

        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Retry attempt ${attempt} failed:`, error);

        // Update error event with retry attempt
        await this.updateErrorEvent(errorEventId, {
          context: {
            retryAttempt: attempt,
            lastError: error.message,
          },
        });
      }
    }

    // All retries failed
    this.updateCircuitBreakerState();
    await this.handleNonRetryableError(errorEventId, lastError);
    throw lastError;
  }

  /**
   * Log error event
   */
  private async logError(
    error: Error,
    type: ErrorEvent['type'],
    context: Record<string, any>
  ): Promise<ErrorEvent> {
    try {
      const severity = this.determineSeverity(error, type);

      const { data, error: dbError } = await this.supabase
        .from('email_errors')
        .insert({
          type,
          severity,
          message: error.message,
          stack: error.stack,
          context,
          created_at: new Date().toISOString(),
          is_resolved: false,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to log error: ${dbError.message}`);
      }

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_error_logged',
        details: {
          errorId: data.id,
          type,
          severity,
          message: error.message,
        },
      });

      return data;
    } catch (error) {
      console.error('Error logging error event:', error);
      throw error;
    }
  }

  /**
   * Update error event
   */
  private async updateErrorEvent(
    errorId: string,
    updates: Partial<ErrorEvent>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_errors')
        .update(updates)
        .eq('id', errorId);

      if (error) {
        console.error('Failed to update error event:', error);
      }
    } catch (error) {
      console.error('Error updating error event:', error);
    }
  }

  /**
   * Resolve error event
   */
  private async resolveError(errorId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_errors')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', errorId);

      if (error) {
        console.error('Failed to resolve error:', error);
      }
    } catch (error) {
      console.error('Error resolving error:', error);
    }
  }

  /**
   * Handle non-retryable error
   */
  private async handleNonRetryableError(
    errorEventId: string,
    error?: Error
  ): Promise<void> {
    try {
      // Update error event
      await this.updateErrorEvent(errorEventId, {
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      });

      // Send notification for critical errors
      const errorEvent = await this.getErrorEvent(errorEventId);
      if (errorEvent && errorEvent.severity === 'critical') {
        await this.sendCriticalErrorNotification(errorEvent, error);
      }
    } catch (error) {
      console.error('Error handling non-retryable error:', error);
    }
  }

  /**
   * Get error event by ID
   */
  private async getErrorEvent(errorId: string): Promise<ErrorEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_errors')
        .select('*')
        .eq('id', errorId)
        .single();

      if (error) {
        console.error('Failed to fetch error event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching error event:', error);
      return null;
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(
    error: Error,
    type: ErrorEvent['type']
  ): ErrorEvent['severity'] {
    // Check for specific error patterns
    if (
      error.message.includes('API key') ||
      error.message.includes('authentication')
    ) {
      return 'critical';
    }

    if (
      error.message.includes('rate limit') ||
      error.message.includes('quota')
    ) {
      return 'high';
    }

    if (
      error.message.includes('validation') ||
      error.message.includes('format')
    ) {
      return 'medium';
    }

    // Default based on type
    const severityMap: Record<ErrorEvent['type'], ErrorEvent['severity']> = {
      sendgrid_api: 'high',
      template_rendering: 'medium',
      queue_processing: 'high',
      webhook_processing: 'medium',
      validation: 'low',
    };

    return severityMap[type] || 'medium';
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: Error, type: ErrorEvent['type']): boolean {
    // Don't retry certain error types
    const nonRetryablePatterns = [
      'authentication',
      'API key',
      'invalid email',
      'malformed',
      'validation',
    ];

    if (
      nonRetryablePatterns.some(pattern =>
        error.message.toLowerCase().includes(pattern)
      )
    ) {
      return false;
    }

    // Don't retry if circuit breaker is open
    if (this.circuitBreakerState.isOpen) {
      return false;
    }

    return true;
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreakerState(): void {
    this.circuitBreakerState.failureCount++;
    this.circuitBreakerState.lastFailureTime = new Date().toISOString();

    // Open circuit breaker after 5 consecutive failures
    if (this.circuitBreakerState.failureCount >= 5) {
      this.circuitBreakerState.isOpen = true;
      this.circuitBreakerState.nextAttemptTime = new Date(
        Date.now() + 5 * 60 * 1000 // 5 minutes
      ).toISOString();
    }
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuitBreaker(): void {
    this.circuitBreakerState = {
      isOpen: false,
      failureCount: 0,
    };
  }

  /**
   * Check if circuit breaker should be reset
   */
  private shouldAttemptReset(): boolean {
    if (
      !this.circuitBreakerState.isOpen ||
      !this.circuitBreakerState.nextAttemptTime
    ) {
      return false;
    }

    return new Date() >= new Date(this.circuitBreakerState.nextAttemptTime);
  }

  /**
   * Send critical error notification
   */
  private async sendCriticalErrorNotification(
    errorEvent: ErrorEvent,
    error?: Error
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      console.log('Critical error notification:', {
        errorId: errorEvent.id,
        type: errorEvent.type,
        severity: errorEvent.severity,
        message: errorEvent.message,
        context: errorEvent.context,
        originalError: error?.message,
      });

      // In a real implementation, you might:
      // - Send email to admin
      // - Create high-priority alert
      // - Trigger incident response
    } catch (error) {
      console.error('Error sending critical error notification:', error);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case 'hour':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
      }

      const { data, error } = await this.supabase
        .from('email_errors')
        .select('type, severity, is_resolved')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch error stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        unresolved: data.filter(item => !item.is_resolved).length,
      };

      // Count by type and severity
      data.forEach(item => {
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        stats.bySeverity[item.severity] =
          (stats.bySeverity[item.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching error stats:', error);
      throw error;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
