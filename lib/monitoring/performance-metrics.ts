import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  cacheHit: boolean;
  queryCount: number;
  dataSize: number;
  timestamp: number;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  totalQueryCount: number;
  totalDataSize: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats(timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowMs = timeWindow || 60 * 60 * 1000; // 1 hour default

    const recentMetrics = this.metrics.filter(
      metric => now - metric.timestamp < windowMs
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        totalQueryCount: 0,
        totalDataSize: 0,
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime =
      recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
      totalRequests;

    const cacheHits = recentMetrics.filter(metric => metric.cacheHit).length;
    const cacheHitRate = cacheHits / totalRequests;

    const totalQueryCount = recentMetrics.reduce(
      (sum, metric) => sum + metric.queryCount,
      0
    );

    const totalDataSize = recentMetrics.reduce(
      (sum, metric) => sum + metric.dataSize,
      0
    );

    return {
      totalRequests,
      averageResponseTime,
      cacheHitRate,
      totalQueryCount,
      totalDataSize,
    };
  }

  getEndpointStats(endpoint: string, timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowMs = timeWindow || 60 * 60 * 1000;

    const endpointMetrics = this.metrics.filter(
      metric =>
        metric.endpoint === endpoint && now - metric.timestamp < windowMs
    );

    if (endpointMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        totalQueryCount: 0,
        totalDataSize: 0,
      };
    }

    const totalRequests = endpointMetrics.length;
    const averageResponseTime =
      endpointMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
      totalRequests;

    const cacheHits = endpointMetrics.filter(metric => metric.cacheHit).length;
    const cacheHitRate = cacheHits / totalRequests;

    const totalQueryCount = endpointMetrics.reduce(
      (sum, metric) => sum + metric.queryCount,
      0
    );

    const totalDataSize = endpointMetrics.reduce(
      (sum, metric) => sum + metric.dataSize,
      0
    );

    return {
      totalRequests,
      averageResponseTime,
      cacheHitRate,
      totalQueryCount,
      totalDataSize,
    };
  }

  getTopSlowEndpoints(
    limit: number = 10
  ): Array<{ endpoint: string; avgResponseTime: number }> {
    const endpointStats = new Map<string, { total: number; sum: number }>();

    this.metrics.forEach(metric => {
      const existing = endpointStats.get(metric.endpoint) || {
        total: 0,
        sum: 0,
      };
      endpointStats.set(metric.endpoint, {
        total: existing.total + 1,
        sum: existing.sum + metric.responseTime,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.sum / stats.total,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);
  }

  getCachePerformance(): {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
  } {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    const cacheMisses = totalRequests - cacheHits;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      totalRequests,
      cacheHits,
      cacheMisses,
      hitRate,
    };
  }

  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
export function withPerformanceMonitoring(
  endpoint: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = req.method;

    try {
      const response = await handler(req);
      const responseTime = Date.now() - startTime;

      // Extract performance data from response headers
      const cacheHit = response.headers.get('x-cache-hit') === 'true';
      const queryCount = parseInt(response.headers.get('x-query-count') || '0');
      const dataSize = parseInt(response.headers.get('x-data-size') || '0');

      // Record the metric
      performanceMonitor.recordMetric({
        endpoint,
        method,
        responseTime,
        cacheHit,
        queryCount,
        dataSize,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metric
      performanceMonitor.recordMetric({
        endpoint,
        method,
        responseTime,
        cacheHit: false,
        queryCount: 0,
        dataSize: 0,
        timestamp: Date.now(),
      });

      throw error;
    }
  };
}

// Performance metrics API endpoint
export async function getPerformanceMetrics(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  const timeWindow = searchParams.get('timeWindow');

  const windowMs = timeWindow ? parseInt(timeWindow) * 1000 : undefined;

  let stats: PerformanceStats;
  if (endpoint) {
    stats = performanceMonitor.getEndpointStats(endpoint, windowMs);
  } else {
    stats = performanceMonitor.getStats(windowMs);
  }

  const topSlowEndpoints = performanceMonitor.getTopSlowEndpoints(10);
  const cachePerformance = performanceMonitor.getCachePerformance();

  return NextResponse.json({
    success: true,
    stats,
    topSlowEndpoints,
    cachePerformance,
    timestamp: new Date().toISOString(),
  });
}
