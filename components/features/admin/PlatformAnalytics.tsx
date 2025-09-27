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
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';

interface PlatformMetrics {
  totalUsers: number;
  newUsers: number;
  totalContractors: number;
  verifiedContractors: number;
  totalEventManagers: number;
  verificationRate: number;
}

interface PlatformTrends {
  userGrowth: number[];
  verificationTrend: number;
}

interface AnalyticsData {
  metrics: PlatformMetrics;
  trends: PlatformTrends;
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PlatformAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAnalytics = async (period: string = selectedPeriod) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`);

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    loadAnalytics(period);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/reports?type=analytics&format=csv&period=${selectedPeriod}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      default:
        return 'Custom Period';
    }
  };

  const formatChartData = (data: number[], period: string) => {
    const labels = [];
    const now = new Date();

    switch (period) {
      case '24h':
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push({
            label: hour.getHours().toString().padStart(2, '0') + ':00',
            value: data[23 - i] || 0,
          });
        }
        break;
      case '7d':
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push({
            label: day.toLocaleDateString('en-US', { weekday: 'short' }),
            value: data[6 - i] || 0,
          });
        }
        break;
      case '30d':
        for (let i = 29; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push({
            label: day.getDate().toString(),
            value: data[29 - i] || 0,
          });
        }
        break;
      default:
        labels.push({ label: 'Period', value: data[0] || 0 });
    }

    return labels;
  };

  const userDistributionData = analyticsData
    ? [
        {
          name: 'Event Managers',
          value: analyticsData.metrics.totalEventManagers,
          color: COLORS[0],
        },
        {
          name: 'Contractors',
          value: analyticsData.metrics.totalContractors,
          color: COLORS[1],
        },
        {
          name: 'Verified Contractors',
          value: analyticsData.metrics.verifiedContractors,
          color: COLORS[2],
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-muted-foreground">
            {getPeriodLabel(selectedPeriod)} • Last updated:{' '}
            {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => loadAnalytics()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.metrics.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.metrics.newUsers} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contractors
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.metrics.totalContractors.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.metrics.verificationRate}% verified
                </p>
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
                  {analyticsData.metrics.totalEventManagers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verification Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.metrics.verificationRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.trends.verificationTrend > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />+
                      {analyticsData.trends.verificationTrend}% from last period
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {analyticsData.trends.verificationTrend}% from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>User Growth</span>
                </CardTitle>
                <CardDescription>
                  New user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatChartData(
                        analyticsData.trends.userGrowth,
                        selectedPeriod
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>User Distribution</span>
                </CardTitle>
                <CardDescription>Breakdown of user types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart.Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart.Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verified</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    {analyticsData.metrics.verifiedContractors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <Badge
                    variant="default"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    {analyticsData.metrics.totalContractors -
                      analyticsData.metrics.verifiedContractors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <Badge variant="outline">
                    {analyticsData.metrics.totalContractors}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Users</span>
                  <span className="text-sm font-bold text-green-600">
                    +{analyticsData.metrics.newUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <span className="text-sm font-bold">
                    {analyticsData.metrics.totalUsers > 0
                      ? (
                          (analyticsData.metrics.newUsers /
                            analyticsData.metrics.totalUsers) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Period</span>
                  <span className="text-sm text-muted-foreground">
                    {getPeriodLabel(selectedPeriod)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Rate</span>
                  <Badge
                    variant={
                      analyticsData.metrics.verificationRate >= 80
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      analyticsData.metrics.verificationRate >= 80
                        ? 'bg-green-100 text-green-800'
                        : ''
                    }
                  >
                    {analyticsData.metrics.verificationRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Balance</span>
                  <span className="text-sm text-muted-foreground">
                    {analyticsData.metrics.totalEventManagers} EM :{' '}
                    {analyticsData.metrics.totalContractors} C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
