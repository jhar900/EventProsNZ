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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserCheck,
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';

interface DashboardMetrics {
  totalUsers: number;
  newUsers: number;
  totalContractors: number;
  verifiedContractors: number;
  totalEventManagers: number;
  verificationRate: number;
  pendingVerifications: number;
  activeAlerts: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

interface DashboardTrends {
  userGrowth: number[];
  verificationTrend: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { fetchAnalytics, fetchSystemHealth } = useAdmin();
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsResponse, healthResponse] = await Promise.all([
        fetch('/api/admin/analytics?period=7d'),
        fetch('/api/admin/system?type=health'),
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setMetrics({
          totalUsers: analyticsData.metrics.totalUsers,
          newUsers: analyticsData.metrics.newUsers,
          totalContractors: analyticsData.metrics.totalContractors,
          verifiedContractors: analyticsData.metrics.verifiedContractors,
          totalEventManagers: analyticsData.metrics.totalEventManagers,
          verificationRate: analyticsData.metrics.verificationRate,
          pendingVerifications:
            analyticsData.metrics.pendingVerifications ||
            analyticsData.metrics.totalContractors -
              analyticsData.metrics.verifiedContractors,
          activeAlerts: 0, // Will be updated from health response
          systemHealth: 'healthy', // Will be updated from health response
        });
        setTrends(analyticsData.trends);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const activeAlerts =
          healthData.health.alerts?.filter((alert: any) => !alert.is_resolved)
            .length || 0;
        setMetrics(prev =>
          prev
            ? {
                ...prev,
                activeAlerts,
                systemHealth: healthData.health.status,
              }
            : null
        );
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
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

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Degraded
          </Badge>
        );
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Health</span>
              {getHealthBadge(metrics.systemHealth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Database response time and system status
                </p>
                <p
                  className={`text-sm font-medium ${getHealthColor(metrics.systemHealth)}`}
                >
                  Status:{' '}
                  {metrics.systemHealth.charAt(0).toUpperCase() +
                    metrics.systemHealth.slice(1)}
                </p>
              </div>
              {metrics.activeAlerts > 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {metrics.activeAlerts} Active Alert
                    {metrics.activeAlerts !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Alerts
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalUsers?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                +{metrics?.newUsers || 0} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contractors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalContractors?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.verificationRate || 0}% verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Verifications
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.pendingVerifications || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Event Managers
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalEventManagers?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/admin/verification')}
            >
              <UserCheck className="h-6 w-6" />
              <span>Review Verifications</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/admin/reports')}
            >
              <FileText className="h-6 w-6" />
              <span>Generate Reports</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/admin/system')}
            >
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  System health check completed
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  New contractor registration
                </p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Verification queue updated
                </p>
                <p className="text-xs text-muted-foreground">10 minutes ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
