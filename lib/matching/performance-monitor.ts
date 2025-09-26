interface MatchingMetrics {
  event_id: string;
  algorithm: string;
  query_time_ms: number;
  contractors_processed: number;
  cache_hit_rate: number;
  algorithm_time_ms: number;
  memory_usage_mb: number;
  created_at: string;
}

interface PerformanceThresholds {
  max_query_time_ms: number;
  max_algorithm_time_ms: number;
  min_cache_hit_rate: number;
  max_memory_usage_mb: number;
}

export class MatchingPerformanceMonitor {
  private metrics: MatchingMetrics[] = [];
  private readonly thresholds: PerformanceThresholds = {
    max_query_time_ms: 5000, // 5 seconds
    max_algorithm_time_ms: 2000, // 2 seconds
    min_cache_hit_rate: 0.8, // 80%
    max_memory_usage_mb: 100, // 100MB
  };

  /**
   * Log performance metrics for a matching operation
   */
  async logMatchingMetrics(
    eventId: string,
    algorithm: string,
    queryTimeMs: number,
    contractorsProcessed: number,
    cacheHitRate: number,
    algorithmTimeMs: number,
    memoryUsageMb: number
  ): Promise<void> {
    const metrics: MatchingMetrics = {
      event_id: eventId,
      algorithm,
      query_time_ms: queryTimeMs,
      contractors_processed: contractorsProcessed,
      cache_hit_rate: cacheHitRate,
      algorithm_time_ms: algorithmTimeMs,
      memory_usage_mb: memoryUsageMb,
      created_at: new Date().toISOString(),
    };

    this.metrics.push(metrics);

    // Check for performance issues
    await this.checkPerformanceThresholds(metrics);

    console.log(`Performance metrics logged for event ${eventId}:`, {
      queryTime: `${queryTimeMs}ms`,
      contractors: contractorsProcessed,
      cacheHitRate: `${(cacheHitRate * 100).toFixed(1)}%`,
      algorithmTime: `${algorithmTimeMs}ms`,
      memoryUsage: `${memoryUsageMb.toFixed(2)}MB`,
    });
  }

  /**
   * Check if performance metrics exceed thresholds
   */
  private async checkPerformanceThresholds(
    metrics: MatchingMetrics
  ): Promise<void> {
    const issues: string[] = [];

    if (metrics.query_time_ms > this.thresholds.max_query_time_ms) {
      issues.push(
        `Query time ${metrics.query_time_ms}ms exceeds threshold ${this.thresholds.max_query_time_ms}ms`
      );
    }

    if (metrics.algorithm_time_ms > this.thresholds.max_algorithm_time_ms) {
      issues.push(
        `Algorithm time ${metrics.algorithm_time_ms}ms exceeds threshold ${this.thresholds.max_algorithm_time_ms}ms`
      );
    }

    if (metrics.cache_hit_rate < this.thresholds.min_cache_hit_rate) {
      issues.push(
        `Cache hit rate ${(metrics.cache_hit_rate * 100).toFixed(1)}% below threshold ${this.thresholds.min_cache_hit_rate * 100}%`
      );
    }

    if (metrics.memory_usage_mb > this.thresholds.max_memory_usage_mb) {
      issues.push(
        `Memory usage ${metrics.memory_usage_mb.toFixed(2)}MB exceeds threshold ${this.thresholds.max_memory_usage_mb}MB`
      );
    }

    if (issues.length > 0) {
      console.warn(
        `Performance issues detected for event ${metrics.event_id}:`,
        issues
      );

      // In a real implementation, you might:
      // - Send alerts to monitoring systems
      // - Log to external monitoring services
      // - Trigger automatic scaling
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeRangeHours: number = 24): {
    totalOperations: number;
    averageQueryTime: number;
    averageAlgorithmTime: number;
    averageCacheHitRate: number;
    averageMemoryUsage: number;
    slowOperations: number;
    performanceIssues: number;
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(
      m => new Date(m.created_at) > cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageQueryTime: 0,
        averageAlgorithmTime: 0,
        averageCacheHitRate: 0,
        averageMemoryUsage: 0,
        slowOperations: 0,
        performanceIssues: 0,
      };
    }

    const totalOperations = recentMetrics.length;
    const averageQueryTime =
      recentMetrics.reduce((sum, m) => sum + m.query_time_ms, 0) /
      totalOperations;
    const averageAlgorithmTime =
      recentMetrics.reduce((sum, m) => sum + m.algorithm_time_ms, 0) /
      totalOperations;
    const averageCacheHitRate =
      recentMetrics.reduce((sum, m) => sum + m.cache_hit_rate, 0) /
      totalOperations;
    const averageMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memory_usage_mb, 0) /
      totalOperations;

    const slowOperations = recentMetrics.filter(
      m =>
        m.query_time_ms > this.thresholds.max_query_time_ms ||
        m.algorithm_time_ms > this.thresholds.max_algorithm_time_ms
    ).length;

    const performanceIssues = recentMetrics.filter(
      m =>
        m.query_time_ms > this.thresholds.max_query_time_ms ||
        m.algorithm_time_ms > this.thresholds.max_algorithm_time_ms ||
        m.cache_hit_rate < this.thresholds.min_cache_hit_rate ||
        m.memory_usage_mb > this.thresholds.max_memory_usage_mb
    ).length;

    return {
      totalOperations,
      averageQueryTime: Math.round(averageQueryTime),
      averageAlgorithmTime: Math.round(averageAlgorithmTime),
      averageCacheHitRate: Math.round(averageCacheHitRate * 100) / 100,
      averageMemoryUsage: Math.round(averageMemoryUsage * 100) / 100,
      slowOperations,
      performanceIssues,
    };
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(timeRangeHours: number = 24): {
    queryTimeTrend: { time: string; value: number }[];
    algorithmTimeTrend: { time: string; value: number }[];
    cacheHitRateTrend: { time: string; value: number }[];
    memoryUsageTrend: { time: string; value: number }[];
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentMetrics = this.metrics
      .filter(m => new Date(m.created_at) > cutoffTime)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const queryTimeTrend = recentMetrics.map(m => ({
      time: m.created_at,
      value: m.query_time_ms,
    }));

    const algorithmTimeTrend = recentMetrics.map(m => ({
      time: m.created_at,
      value: m.algorithm_time_ms,
    }));

    const cacheHitRateTrend = recentMetrics.map(m => ({
      time: m.created_at,
      value: m.cache_hit_rate,
    }));

    const memoryUsageTrend = recentMetrics.map(m => ({
      time: m.created_at,
      value: m.memory_usage_mb,
    }));

    return {
      queryTimeTrend,
      algorithmTimeTrend,
      cacheHitRateTrend,
      memoryUsageTrend,
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(olderThanHours: number = 168): void {
    // 7 days default
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialCount = this.metrics.length;

    this.metrics = this.metrics.filter(
      m => new Date(m.created_at) > cutoffTime
    );

    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} old performance metrics`);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new MatchingPerformanceMonitor();
