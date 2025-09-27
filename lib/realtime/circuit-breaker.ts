/**
 * Circuit Breaker Pattern for Real-time Connections
 * Provides fallback mechanisms and reliability for real-time features
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  fallbackEnabled: boolean;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 30000, // 30 seconds
      monitoringPeriod: config.monitoringPeriod || 10000, // 10 seconds
      fallbackEnabled: config.fallbackEnabled !== false,
    };

    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };

    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() < this.state.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
      this.state.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (this.config.fallbackEnabled && fallback) {
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state.state === 'CLOSED' || this.state.state === 'HALF_OPEN';
  }

  private onSuccess(): void {
    this.state.failureCount = 0;
    this.state.state = 'CLOSED';
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failureCount >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitor();
    }, this.config.monitoringPeriod);
  }

  private monitor(): void {
    if (this.state.state === 'OPEN' && Date.now() >= this.state.nextAttemptTime) {
      this.state.state = 'HALF_OPEN';
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}
