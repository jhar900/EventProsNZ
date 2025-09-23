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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  Server,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  database: {
    status: string;
    responseTime: number;
    error?: string;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalContractors: number;
    pendingVerifications: number;
  };
  alerts: any[];
  recentErrors: any[];
  timestamp: string;
}

interface SystemPerformance {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  uptime: number;
  timestamp: string;
}

export default function SystemHealthMonitor() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemPerformance, setSystemPerformance] =
    useState<SystemPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { fetchSystemHealth, fetchSystemPerformance } = useAdmin();

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [healthResponse, performanceResponse] = await Promise.all([
        fetchSystemHealth(),
        fetchSystemPerformance('24h'),
      ]);

      if (healthResponse) {
        setSystemHealth(healthResponse.health);
      }

      if (performanceResponse) {
        setSystemPerformance(performanceResponse.performance);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load system data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system health data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Health Monitor
          </h1>
          <p className="text-muted-foreground">
            Monitor system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={loadSystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Status</span>
              {getHealthBadge(systemHealth.status)}
            </CardTitle>
            <CardDescription>
              Overall system health and status indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.database.responseTime}ms
                </div>
                <div className="text-xs text-muted-foreground">
                  Response time
                </div>
                <Badge
                  variant={
                    systemHealth.database.status === 'connected'
                      ? 'default'
                      : 'destructive'
                  }
                  className={
                    systemHealth.database.status === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : ''
                  }
                >
                  {systemHealth.database.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.activeUsers}
                </div>
                <div className="text-xs text-muted-foreground">
                  Currently online
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Active Alerts</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.alerts?.filter(
                    (alert: any) => !alert.is_resolved
                  ).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Require attention
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Last Check</span>
                </div>
                <div className="text-sm font-bold">
                  {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  System check
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {systemPerformance && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* CPU Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span>CPU Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Usage</span>
                  <span
                    className={`text-sm font-bold ${getPerformanceColor(systemPerformance.cpu.usage)}`}
                  >
                    {systemPerformance.cpu.usage}%
                  </span>
                </div>
                <Progress value={systemPerformance.cpu.usage} className="h-2" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cores:</span>
                    <span className="ml-2 font-medium">
                      {systemPerformance.cpu.cores}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Load:</span>
                    <span className="ml-2 font-medium">
                      {systemPerformance.cpu.load
                        .map(l => l.toFixed(2))
                        .join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MemoryStick className="h-5 w-5" />
                <span>Memory Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory</span>
                  <span
                    className={`text-sm font-bold ${getPerformanceColor(systemPerformance.memory.percentage)}`}
                  >
                    {systemPerformance.memory.percentage}%
                  </span>
                </div>
                <Progress
                  value={systemPerformance.memory.percentage}
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Used:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.memory.used)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.memory.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Disk Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <span
                    className={`text-sm font-bold ${getPerformanceColor(systemPerformance.disk.percentage)}`}
                  >
                    {systemPerformance.disk.percentage}%
                  </span>
                </div>
                <Progress
                  value={systemPerformance.disk.percentage}
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Used:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.disk.used)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.disk.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network & Uptime */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Network & Uptime</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bytes In:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.network.bytesIn)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bytes Out:</span>
                    <span className="ml-2 font-medium">
                      {formatBytes(systemPerformance.network.bytesOut)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Connections:</span>
                    <span className="ml-2 font-medium">
                      {systemPerformance.network.connections}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="ml-2 font-medium">
                      {formatUptime(systemPerformance.uptime)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Errors */}
      {systemHealth?.recentErrors && systemHealth.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Recent Errors</span>
            </CardTitle>
            <CardDescription>Latest system errors and issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemHealth.recentErrors
                    .slice(0, 10)
                    .map((error: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {error.message || error.error}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {error.type || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              error.severity === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {error.severity || 'medium'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(
                                error.timestamp || error.created_at
                              ).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Metrics Summary */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>System Metrics</span>
            </CardTitle>
            <CardDescription>Key system metrics and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.totalUsers.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Registered users
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Contractors</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.totalContractors.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Service providers
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Pending Verifications
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.pendingVerifications}
                </div>
                <div className="text-xs text-muted-foreground">
                  Awaiting review
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">System Load</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemPerformance
                    ? `${systemPerformance.cpu.usage}%`
                    : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">CPU usage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
