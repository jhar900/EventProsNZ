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
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Award,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

interface ContractorPerformanceData {
  contractorId: string;
  name: string;
  email: string;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  revenue: number;
  responseTime: number;
  completionRate: number;
  customerSatisfaction: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface PerformanceMetrics {
  totalContractors: number;
  activeContractors: number;
  averageRating: number;
  averageCompletionRate: number;
  averageResponseTime: number;
  totalRevenue: number;
  topPerformers: number;
}

interface ContractorPerformanceAnalyticsData {
  contractors: ContractorPerformanceData[];
  metrics: PerformanceMetrics;
  trends: {
    ratingTrend: 'up' | 'down' | 'stable';
    completionTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
  };
  rankings: {
    topRated: ContractorPerformanceData[];
    topEarners: ContractorPerformanceData[];
    mostActive: ContractorPerformanceData[];
  };
}

export default function ContractorPerformance() {
  const [data, setData] = useState<ContractorPerformanceAnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('rating');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/contractors?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading contractor performance analytics:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-yellow-600';
      case 'suspended':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Inactive
          </Badge>
        );
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          Loading contractor performance analytics...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            No contractor performance data available
          </p>
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
            Contractor Performance
          </h2>
          <p className="text-muted-foreground">
            Contractor metrics, rankings, and performance analytics
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
            <CardTitle className="text-sm font-medium">
              Total Contractors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalContractors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.activeContractors} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.averageRating.toFixed(1)}/5
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.ratingTrend)}
              <span className={getTrendColor(data.trends.ratingTrend)}>
                {data.trends.ratingTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.averageCompletionRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.completionTrend)}
              <span className={getTrendColor(data.trends.completionTrend)}>
                {data.trends.completionTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.metrics.totalRevenue)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.revenueTrend)}
              <span className={getTrendColor(data.trends.revenueTrend)}>
                {data.trends.revenueTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rating vs Revenue Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Rating vs Revenue</CardTitle>
            <CardDescription>
              Contractor performance correlation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={data.contractors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" name="Rating" domain={[0, 5]} />
                  <YAxis dataKey="revenue" name="Revenue" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue'
                        ? formatCurrency(Number(value))
                        : value,
                      name === 'revenue' ? 'Revenue' : 'Rating',
                    ]}
                  />
                  <Scatter dataKey="revenue" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>
              Average response times by contractor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contractors.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={value => [
                      formatTime(Number(value)),
                      'Response Time',
                    ]}
                  />
                  <Bar dataKey="responseTime" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Rated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Top Rated</span>
            </CardTitle>
            <CardDescription>Highest rated contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rankings.topRated.slice(0, 5).map((contractor, index) => (
                <div
                  key={contractor.contractorId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{contractor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contractor.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {contractor.rating.toFixed(1)}⭐
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contractor.completedJobs} jobs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Top Earners</span>
            </CardTitle>
            <CardDescription>Highest earning contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rankings.topEarners.slice(0, 5).map((contractor, index) => (
                <div
                  key={contractor.contractorId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{contractor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contractor.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(contractor.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contractor.completedJobs} jobs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Most Active</span>
            </CardTitle>
            <CardDescription>Most active contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rankings.mostActive.slice(0, 5).map((contractor, index) => (
                <div
                  key={contractor.contractorId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{contractor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contractor.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {contractor.totalJobs} jobs
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contractor.completionRate.toFixed(1)}% completion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Contractors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contractors</CardTitle>
          <CardDescription>
            Complete contractor performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Contractor</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Jobs</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Response Time</th>
                  <th className="text-left p-2">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.contractors.map(contractor => (
                  <tr key={contractor.contractorId} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{contractor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contractor.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{getStatusBadge(contractor.status)}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{contractor.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">
                          {contractor.completedJobs}/{contractor.totalJobs}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          completed
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatCurrency(contractor.revenue)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatTime(contractor.responseTime)}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          contractor.completionRate >= 90
                            ? 'default'
                            : contractor.completionRate >= 70
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {contractor.completionRate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
