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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Target,
  Award,
} from 'lucide-react';

interface UserGrowthData {
  date: string;
  signups: number;
  activeUsers: number;
  churnedUsers: number;
  retentionRate: number;
}

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
  revenue: number;
}

interface UserGrowthAnalyticsData {
  growth: UserGrowthData[];
  cohorts: CohortData[];
  summary: {
    totalSignups: number;
    totalActiveUsers: number;
    totalChurned: number;
    averageRetention: number;
    churnRate: number;
    growthRate: number;
  };
  trends: {
    signupTrend: 'up' | 'down' | 'stable';
    retentionTrend: 'up' | 'down' | 'stable';
    churnTrend: 'up' | 'down' | 'stable';
  };
}

export default function UserGrowthAnalytics() {
  const [data, setData] = useState<UserGrowthAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('growth');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/users?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading user growth analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCohortData = (cohorts: CohortData[]) => {
    return cohorts.map(cohort => ({
      cohort: cohort.cohort,
      ...cohort.retention.reduce(
        (acc, value, index) => {
          acc[`week${index + 1}`] = value;
          return acc;
        },
        {} as Record<string, number>
      ),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user growth analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No user growth data available</p>
          <Button onClick={loadAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            User Growth Analytics
          </h2>
          <p className="text-muted-foreground">
            User acquisition, retention, and churn analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalSignups.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.signupTrend)}
              <span className={getTrendColor(data.trends.signupTrend)}>
                {data.trends.signupTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalActiveUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageRetention.toFixed(1)}% retention rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churned Users</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalChurned.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.churnTrend)}
              <span className={getTrendColor(data.trends.churnTrend)}>
                {data.summary.churnRate.toFixed(1)}% churn rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.growthRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.retentionTrend)}
              <span className={getTrendColor(data.trends.retentionTrend)}>
                {data.trends.retentionTrend} retention
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>
              Signups, active users, and churn trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Signups"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Retention Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Retention Rate</CardTitle>
            <CardDescription>
              User retention percentage over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={value => [`${value}%`, 'Retention']} />
                  <Line
                    type="monotone"
                    dataKey="retentionRate"
                    stroke="#ff7300"
                    strokeWidth={2}
                    dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      {data.cohorts && data.cohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Cohort Analysis</span>
            </CardTitle>
            <CardDescription>User retention by signup cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cohort</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Week 1</th>
                    <th className="text-left p-2">Week 2</th>
                    <th className="text-left p-2">Week 3</th>
                    <th className="text-left p-2">Week 4</th>
                    <th className="text-left p-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts.map((cohort, index) => (
                    <tr key={cohort.cohort} className="border-b">
                      <td className="p-2 font-medium">{cohort.cohort}</td>
                      <td className="p-2">{cohort.size.toLocaleString()}</td>
                      {cohort.retention.map((retention, weekIndex) => (
                        <td key={weekIndex} className="p-2">
                          <Badge
                            variant={
                              retention >= 80
                                ? 'default'
                                : retention >= 60
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {retention.toFixed(1)}%
                          </Badge>
                        </td>
                      ))}
                      <td className="p-2">
                        ${cohort.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Churn Analysis</CardTitle>
          <CardDescription>User churn patterns and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="churnedUsers"
                  fill="#ff7300"
                  name="Churned Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
