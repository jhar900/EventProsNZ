/**
 * Performance Monitoring System
 * Comprehensive monitoring for application performance, database queries, and user experience
 */

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'api' | 'database' | 'frontend' | 'realtime' | 'file_upload';
  name: string;
  duration: number;
  status: 'success' | 'error' | 'warning';
  metadata: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceThresholds {
  api: {
    warning: number; // ms
    error: number; // ms
  };
  database: {
    warning: number; // ms
    error: number; // ms
  };
  frontend: {
    warning: number; // ms
    error: number; // ms
  };
  realtime: {
    warning: number; // ms
    error: number; // ms
  };
  file_upload: {
    warning: number; // ms
    error: number; // ms
  };
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowestQueries: PerformanceMetric[];
  recentErrors: PerformanceMetric[];
  uptime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private startTime: number;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.startTime = Date.now();
    this.thresholds = {
      api: { warning: 1000, error: 3000, ...thresholds.api },
      database: { warning: 500, error: 2000, ...thresholds.database },
      frontend: { warning: 2000, error: 5000, ...thresholds.frontend },
      realtime: { warning: 100, error: 500, ...thresholds.realtime },
      file_upload: { warning: 5000, error: 15000, ...thresholds.file_upload },
    };

    this.startMonitoring();
  }

  /**
   * Start monitoring a performance metric
   */
  startMetric(
    type: PerformanceMetric['type'],
    name: string,
    metadata: Record<string, any> = {}
  ): string {
    const metricId = this.generateMetricId();
    const startTime = Date.now();

    // Store start time in metadata
    metadata._startTime = startTime;
    metadata._metricId = metricId;

    return metricId;
  }

  /**
   * End monitoring a performance metric
   */
  endMetric(
    metricId: string,
    status: PerformanceMetric['status'] = 'success',
    additionalMetadata: Record<string, any> = {}
  ): void {
    const startTime = additionalMetadata._startTime;
    if (!startTime) {
      console.warn('Metric end called without start time');
      return;
    }

    const duration = Date.now() - startTime;
    const type = additionalMetadata._type as PerformanceMetric['type'];
    const name = additionalMetadata._name as string;

    const metric: PerformanceMetric = {
      id: metricId,
      timestamp: Date.now(),
      type,
      name,
      duration,
      status,
      metadata: {
        ...additionalMetadata,
        _startTime: undefined,
        _metricId: undefined,
        _type: undefined,
        _name: undefined,
      },
      userId: additionalMetadata.userId,
      sessionId: additionalMetadata.sessionId,
    };

    this.recordMetric(metric);
  }

  /**
   * Record a performance metric directly
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Check thresholds and alert if necessary
    this.checkThresholds(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > last24Hours);

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const errorRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length
      : 0;

    const slowestQueries = recentMetrics
      .filter(m => m.type === 'database')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const recentErrors = recentMetrics
      .filter(m => m.status === 'error')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowestQueries,
      recentErrors,
      uptime: now - this.startTime,
    };
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type'], limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.timestamp);
  }

  /**
   * Create a performance decorator for functions
   */
  createPerformanceDecorator(
    type: PerformanceMetric['type'],
    name: string,
    metadata: Record<string, any> = {}
  ) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const metricId = PerformanceMonitor.getInstance().startMetric(type, name, {
          ...metadata,
          function: propertyName,
          args: args.length,
        });

        try {
          const result = await method.apply(this, args);
          PerformanceMonitor.getInstance().endMetric(metricId, 'success');
          return result;
        } catch (error) {
          PerformanceMonitor.getInstance().endMetric(metricId, 'error', {
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * Create a performance wrapper for async functions
   */
  wrapAsyncFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    type: PerformanceMetric['type'],
    name: string,
    metadata: Record<string, any> = {}
  ) {
    return async (...args: T): Promise<R> => {
      const metricId = this.startMetric(type, name, {
        ...metadata,
        args: args.length,
      });

      try {
        const result = await fn(...args);
        this.endMetric(metricId, 'success');
        return result;
      } catch (error) {
        this.endMetric(metricId, 'error', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.type];
    if (!threshold) return;

    if (metric.duration >= threshold.error) {
      this.alert('error', metric, `Performance error: ${metric.name} took ${metric.duration}ms`);
    } else if (metric.duration >= threshold.warning) {
      this.alert('warning', metric, `Performance warning: ${metric.name} took ${metric.duration}ms`);
    }
  }

  private alert(level: 'warning' | 'error', metric: PerformanceMetric, message: string): void {
    console.warn(`[${level.toUpperCase()}] ${message}`, {
      metric: metric.name,
      duration: metric.duration,
      type: metric.type,
      metadata: metric.metadata,
    });

    // Send to external monitoring service
    this.sendToMonitoringService(level, metric, message);
  }

  private async sendToMonitoringService(
    level: 'warning' | 'error',
    metric: PerformanceMetric,
    message: string
  ): Promise<void> {
    try {
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          metric,
          message,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send alert to monitoring service:', error);
    }
  }

  private collectSystemMetrics(): void {
    // Collect system-level metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.recordMetric({
      id: this.generateMetricId(),
      timestamp: Date.now(),
      type: 'api',
      name: 'system_metrics',
      duration: 0,
      status: 'success',
      metadata: {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      },
    });
  }

  private generateMetricId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Singleton pattern
  private static instance: PerformanceMonitor | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
