/**
 * Payment Performance Monitoring Service
 * Monitors payment processing performance and provides metrics
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'memory_usage' | 'throughput';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // milliseconds
  maxErrorRate: number; // percentage
  maxMemoryUsage: number; // MB
  minThroughput: number; // requests per second
  maxDatabaseConnections: number;
  minCacheHitRate: number; // percentage
}

export class PaymentPerformanceMonitoring {
  private supabase: SupabaseClient;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
    this.thresholds = {
      maxResponseTime: 1000, // 1 second
      maxErrorRate: 5, // 5%
      maxMemoryUsage: 2048, // 2GB
      minThroughput: 100, // 100 RPS
      maxDatabaseConnections: 100,
      minCacheHitRate: 80, // 80%
    };
  }

  /**
   * Record performance metrics
   */
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      this.metrics.push(metrics);

      // Store in database
      const result = await this.supabase.from('performance_metrics').insert({
        response_time: metrics.responseTime,
        throughput: metrics.throughput,
        error_rate: metrics.errorRate,
        success_rate: metrics.successRate,
        memory_usage: metrics.memoryUsage,
        cpu_usage: metrics.cpuUsage,
        database_connections: metrics.databaseConnections,
        cache_hit_rate: metrics.cacheHitRate,
        timestamp: new Date().toISOString(),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Check for alerts
      await this.checkAlerts(metrics);
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
      throw new Error('Database error');
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Check response time
    if (metrics.responseTime > this.thresholds.maxResponseTime) {
      alerts.push({
        id: `response_time_${Date.now()}`,
        type: 'response_time',
        severity: this.getSeverity(
          metrics.responseTime,
          this.thresholds.maxResponseTime
        ),
        message: `Response time exceeded threshold: ${metrics.responseTime}ms > ${this.thresholds.maxResponseTime}ms`,
        threshold: this.thresholds.maxResponseTime,
        actualValue: metrics.responseTime,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      alerts.push({
        id: `error_rate_${Date.now()}`,
        type: 'error_rate',
        severity: this.getSeverity(
          metrics.errorRate,
          this.thresholds.maxErrorRate
        ),
        message: `Error rate exceeded threshold: ${metrics.errorRate}% > ${this.thresholds.maxErrorRate}%`,
        threshold: this.thresholds.maxErrorRate,
        actualValue: metrics.errorRate,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        id: `memory_usage_${Date.now()}`,
        type: 'memory_usage',
        severity: this.getSeverity(
          metrics.memoryUsage,
          this.thresholds.maxMemoryUsage
        ),
        message: `Memory usage exceeded threshold: ${metrics.memoryUsage}MB > ${this.thresholds.maxMemoryUsage}MB`,
        threshold: this.thresholds.maxMemoryUsage,
        actualValue: metrics.memoryUsage,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Check throughput
    if (metrics.throughput < this.thresholds.minThroughput) {
      alerts.push({
        id: `throughput_${Date.now()}`,
        type: 'throughput',
        severity: this.getSeverity(
          this.thresholds.minThroughput,
          metrics.throughput
        ),
        message: `Throughput below threshold: ${metrics.throughput} RPS < ${this.thresholds.minThroughput} RPS`,
        threshold: this.thresholds.minThroughput,
        actualValue: metrics.throughput,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.supabase.from('performance_alerts').insert(alert);
      this.alerts.push(alert);
    }
  }

  /**
   * Get severity level based on threshold comparison
   */
  private getSeverity(
    actual: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = actual / threshold;

    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics | null> {
    try {
      const { data } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      return {
        responseTime: data.response_time,
        throughput: data.throughput,
        errorRate: data.error_rate,
        successRate: data.success_rate,
        memoryUsage: data.memory_usage,
        cpuUsage: data.cpu_usage,
        databaseConnections: data.database_connections,
        cacheHitRate: data.cache_hit_rate,
      };
    } catch (error) {
      console.error('Failed to get current metrics:', error);
      return null;
    }
  }

  /**
   * Get performance metrics for a time range
   */
  async getMetricsRange(
    startDate: string,
    endDate: string
  ): Promise<PerformanceMetrics[]> {
    try {
      const { data } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true });

      return (
        data?.map(metric => ({
          responseTime: metric.response_time,
          throughput: metric.throughput,
          errorRate: metric.error_rate,
          successRate: metric.success_rate,
          memoryUsage: metric.memory_usage,
          cpuUsage: metric.cpu_usage,
          databaseConnections: metric.database_connections,
          cacheHitRate: metric.cache_hit_rate,
        })) || []
      );
    } catch (error) {
      console.error('Failed to get metrics range:', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    try {
      const { data } = await this.supabase
        .from('performance_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('performance_alerts')
        .update({ resolved: true })
        .eq('id', alertId);

      // Update local alerts
      const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        this.alerts[alertIndex].resolved = true;
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    averageResponseTime: number;
    averageThroughput: number;
    averageErrorRate: number;
    averageSuccessRate: number;
    totalAlerts: number;
    activeAlerts: number;
  }> {
    try {
      const { data: metrics } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .gte(
          'timestamp',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('timestamp', { ascending: false });

      const { data: alerts } = await this.supabase
        .from('performance_alerts')
        .select('*')
        .gte(
          'timestamp',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (!metrics || metrics.length === 0) {
        return {
          averageResponseTime: 0,
          averageThroughput: 0,
          averageErrorRate: 0,
          averageSuccessRate: 0,
          totalAlerts: 0,
          activeAlerts: 0,
        };
      }

      const averageResponseTime =
        metrics.reduce((sum, m) => sum + m.response_time, 0) / metrics.length;
      const averageThroughput =
        metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
      const averageErrorRate =
        metrics.reduce((sum, m) => sum + m.error_rate, 0) / metrics.length;
      const averageSuccessRate =
        metrics.reduce((sum, m) => sum + m.success_rate, 0) / metrics.length;
      const totalAlerts = alerts?.length || 0;
      const activeAlerts = alerts?.filter(a => !a.resolved).length || 0;

      return {
        averageResponseTime,
        averageThroughput,
        averageErrorRate,
        averageSuccessRate,
        totalAlerts,
        activeAlerts,
      };
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      return {
        averageResponseTime: 0,
        averageThroughput: 0,
        averageErrorRate: 0,
        averageSuccessRate: 0,
        totalAlerts: 0,
        activeAlerts: 0,
      };
    }
  }

  /**
   * Update performance thresholds
   */
  async updateThresholds(
    thresholds: Partial<PerformanceThresholds>
  ): Promise<void> {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get performance thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Clear old metrics (cleanup)
   */
  async clearOldMetrics(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString();

      await this.supabase
        .from('performance_metrics')
        .delete()
        .lt('timestamp', cutoffDate);

      await this.supabase
        .from('performance_alerts')
        .delete()
        .lt('timestamp', cutoffDate);
    } catch (error) {
      console.error('Failed to clear old metrics:', error);
    }
  }
}
