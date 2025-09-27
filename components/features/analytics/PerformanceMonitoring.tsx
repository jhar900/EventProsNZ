'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface PerformanceMetrics {
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  total_queries: number;
  error_rate: number;
  throughput: number;
}

interface PerformanceAlert {
  alert_type: string;
  alert_message: string;
  metric_value: number;
  threshold_value: number;
  severity: string;
  created_at: string;
}

interface PerformanceMonitoringProps {
  timePeriod: string;
  className?: string;
}

export default function PerformanceMonitoring({
  timePeriod,
  className,
}: PerformanceMonitoringProps) {
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformanceMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/performance/search?period=${timePeriod}`
      );
      const data = await response.json();

      if (data.performance_metrics) {
        setPerformanceMetrics(data.performance_metrics);
      }
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const getPerformanceColor = (metric: string, value: number) => {
    switch (metric) {
      case 'response_time':
        if (value < 500) return 'text-green-600';
        if (value < 1000) return 'text-yellow-600';
        if (value < 2000) return 'text-orange-600';
        return 'text-red-600';
      case 'error_rate':
        if (value < 1) return 'text-green-600';
        if (value < 3) return 'text-yellow-600';
        if (value < 5) return 'text-orange-600';
        return 'text-red-600';
      case 'throughput':
        if (value > 100) return 'text-green-600';
        if (value > 50) return 'text-yellow-600';
        if (value > 20) return 'text-orange-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPerformanceBadgeVariant = (metric: string, value: number) => {
    switch (metric) {
      case 'response_time':
        if (value < 500) return 'default';
        if (value < 1000) return 'secondary';
        if (value < 2000) return 'outline';
        return 'destructive';
      case 'error_rate':
        if (value < 1) return 'default';
        if (value < 3) return 'secondary';
        if (value < 5) return 'outline';
        return 'destructive';
      case 'throughput':
        if (value > 100) return 'default';
        if (value > 50) return 'secondary';
        if (value > 20) return 'outline';
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Monitoring
            </CardTitle>
            <CardDescription>
              Search performance metrics and system health
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceMetrics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance Metrics Overview */}
            {performanceMetrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Response Time
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor('response_time', performanceMetrics.avg_response_time)}`}
                  >
                    {formatTime(performanceMetrics.avg_response_time)}
                  </div>
                  <Badge
                    variant={getPerformanceBadgeVariant(
                      'response_time',
                      performanceMetrics.avg_response_time
                    )}
                  >
                    {performanceMetrics.avg_response_time < 500
                      ? 'Excellent'
                      : performanceMetrics.avg_response_time < 1000
                        ? 'Good'
                        : performanceMetrics.avg_response_time < 2000
                          ? 'Average'
                          : 'Poor'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Error Rate</span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor('error_rate', performanceMetrics.error_rate)}`}
                  >
                    {formatPercentage(performanceMetrics.error_rate)}
                  </div>
                  <Badge
                    variant={getPerformanceBadgeVariant(
                      'error_rate',
                      performanceMetrics.error_rate
                    )}
                  >
                    {performanceMetrics.error_rate < 1
                      ? 'Excellent'
                      : performanceMetrics.error_rate < 3
                        ? 'Good'
                        : performanceMetrics.error_rate < 5
                          ? 'Average'
                          : 'Poor'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Throughput</span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor('throughput', performanceMetrics.throughput)}`}
                  >
                    {formatNumber(performanceMetrics.throughput)}/s
                  </div>
                  <Badge
                    variant={getPerformanceBadgeVariant(
                      'throughput',
                      performanceMetrics.throughput
                    )}
                  >
                    {performanceMetrics.throughput > 100
                      ? 'Excellent'
                      : performanceMetrics.throughput > 50
                        ? 'Good'
                        : performanceMetrics.throughput > 20
                          ? 'Average'
                          : 'Poor'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Max Response Time
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatTime(performanceMetrics.max_response_time)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Peak response time
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Min Response Time
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatTime(performanceMetrics.min_response_time)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fastest response time
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Queries</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(performanceMetrics.total_queries)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Processed queries
                  </p>
                </div>
              </div>
            )}

            {/* Performance Score */}
            {performanceMetrics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Overall Performance Score
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(
                      100 -
                        performanceMetrics.avg_response_time / 20 -
                        performanceMetrics.error_rate * 2
                    )}{' '}
                    / 100
                  </span>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    100 -
                      performanceMetrics.avg_response_time / 20 -
                      performanceMetrics.error_rate * 2
                  )}
                  max={100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Based on response time and error rate metrics
                </p>
              </div>
            )}

            {/* Performance Alerts */}
            <div className="space-y-4">
              <h4 className="font-medium">Performance Alerts</h4>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>No performance alerts - system is running smoothly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 10).map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {alert.alert_type.replace('_', ' ')}
                            </span>
                            <Badge
                              variant="outline"
                              className={getSeverityColor(alert.severity)}
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{alert.alert_message}</p>
                          <div className="text-xs text-muted-foreground">
                            <span>Current: {alert.metric_value}</span>
                            <span className="mx-2">•</span>
                            <span>Threshold: {alert.threshold_value}</span>
                            <span className="mx-2">•</span>
                            <span>
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Recommendations */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Performance Recommendations</h4>
              <div className="space-y-2 text-sm">
                {performanceMetrics &&
                  performanceMetrics.avg_response_time > 1000 && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-600">⚡</span>
                      <span>
                        Consider optimizing database queries and implementing
                        caching to reduce response times
                      </span>
                    </div>
                  )}
                {performanceMetrics && performanceMetrics.error_rate > 3 && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">🔧</span>
                    <span>
                      High error rate detected - review error logs and implement
                      better error handling
                    </span>
                  </div>
                )}
                {performanceMetrics && performanceMetrics.throughput < 50 && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">📈</span>
                    <span>
                      Low throughput - consider scaling infrastructure or
                      optimizing search algorithms
                    </span>
                  </div>
                )}
                {performanceMetrics &&
                  performanceMetrics.avg_response_time < 500 &&
                  performanceMetrics.error_rate < 1 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <span>
                        Excellent performance! System is running optimally
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
