'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
} from 'lucide-react';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

interface RealTimeMetricsData {
  metrics: RealTimeMetric[];
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export default function RealTimeMetrics() {
  const [data, setData] = useState<RealTimeMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/analytics/metrics');
      if (response.ok) {
        const metricsData = await response.json();
        setData(metricsData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'currency') {
      return `$${value.toLocaleString()}`;
    }
    if (unit === 'time') {
      return `${value}ms`;
    }
    return value.toLocaleString();
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real-time metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Real-Time Metrics
          </h2>
          <p className="text-muted-foreground">
            Live platform performance and health indicators
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      {data?.systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(data.systemHealth.status)}
                <div>
                  <div className="font-medium capitalize">
                    {data.systemHealth.status}
                  </div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
              <div>
                <div className="font-medium">
                  {data.systemHealth.uptime.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="font-medium">
                  {data.systemHealth.responseTime}ms
                </div>
                <div className="text-sm text-muted-foreground">
                  Response Time
                </div>
              </div>
              <div>
                <div className="font-medium">
                  {data.systemHealth.errorRate.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-Time Metrics Grid */}
      {data?.metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.metrics.map(metric => {
            const change = calculateChange(metric.value, metric.previousValue);
            return (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.name}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(metric.value, metric.unit)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}% from previous
                    </span>
                    <span>•</span>
                    <span>
                      Updated{' '}
                      {new Date(metric.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(metric.status)}
                    >
                      {metric.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : alert.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.type === 'critical' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
        {autoRefresh && ' • Auto-refreshing every 30 seconds'}
      </div>
    </div>
  );
}
