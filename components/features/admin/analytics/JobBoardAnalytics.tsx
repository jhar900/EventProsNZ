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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Users,
  Target,
  Award,
  Clock,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

interface JobBoardData {
  date: string;
  postings: number;
  applications: number;
  conversions: number;
  views: number;
  conversionRate: number;
  averageTimeToFill: number;
}

interface JobCategoryData {
  category: string;
  postings: number;
  applications: number;
  conversions: number;
  conversionRate: number;
  averageBudget: number;
  averageTimeToFill: number;
}

interface TopJobData {
  id: string;
  title: string;
  category: string;
  status: string;
  applications: number;
  views: number;
  conversionRate: number;
  budget: number;
  timeToFill: number;
  postedDate: string;
}

interface JobBoardAnalyticsData {
  jobs: JobBoardData[];
  categories: JobCategoryData[];
  topJobs: TopJobData[];
  summary: {
    totalPostings: number;
    totalApplications: number;
    totalConversions: number;
    averageConversionRate: number;
    averageTimeToFill: number;
    totalViews: number;
    averageViewsPerJob: number;
  };
  trends: {
    postingTrend: 'up' | 'down' | 'stable';
    applicationTrend: 'up' | 'down' | 'stable';
    conversionTrend: 'up' | 'down' | 'stable';
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function JobBoardAnalytics() {
  const [data, setData] = useState<JobBoardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/jobs?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading job board analytics:', error);
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
      case 'filled':
        return 'text-green-600';
      case 'open':
        return 'text-blue-600';
      case 'closed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filled':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Filled
          </Badge>
        );
      case 'open':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Open
          </Badge>
        );
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
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

  const formatTime = (days: number) => {
    if (days < 1) {
      return `${Math.round(days * 24)}h`;
    }
    if (days < 7) {
      return `${days.toFixed(1)}d`;
    }
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return `${weeks}w ${remainingDays.toFixed(0)}d`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading job board analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No job board data available</p>
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
            Job Board Analytics
          </h2>
          <p className="text-muted-foreground">
            Job posting success, application metrics, and conversion tracking
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
              Total Postings
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalPostings.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.postingTrend)}
              <span className={getTrendColor(data.trends.postingTrend)}>
                {data.trends.postingTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalApplications.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.applicationTrend)}
              <span className={getTrendColor(data.trends.applicationTrend)}>
                {data.trends.applicationTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageConversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.conversionTrend)}
              <span className={getTrendColor(data.trends.conversionTrend)}>
                {data.trends.conversionTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Time to Fill
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(data.summary.averageTimeToFill)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to fill
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary.totalConversions}
            </div>
            <p className="text-xs text-muted-foreground">Successful hires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All job postings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Views per Job</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageViewsPerJob.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per posting</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Postings and Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Job Postings and Applications</CardTitle>
            <CardDescription>
              Job posting and application trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.jobs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="postings"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Postings"
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Applications"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
            <CardDescription>
              Application to hire conversion over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.jobs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={value => [`${value}%`, 'Conversion Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversionRate"
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

      {/* Job Categories Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Job Categories Performance</CardTitle>
          <CardDescription>Performance metrics by job category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categories.map((category, index) => (
              <div key={category.category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.category}</h3>
                  <Badge variant="outline">
                    {category.conversionRate.toFixed(1)}% conversion
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Postings</div>
                    <div className="font-medium">{category.postings}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Applications</div>
                    <div className="font-medium">{category.applications}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Conversions</div>
                    <div className="font-medium">{category.conversions}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Conversion Rate</div>
                    <div className="font-medium">
                      {category.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Avg Budget</div>
                    <div className="font-medium">
                      {formatCurrency(category.averageBudget)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">
                      Avg Time to Fill
                    </div>
                    <div className="font-medium">
                      {formatTime(category.averageTimeToFill)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Jobs</CardTitle>
          <CardDescription>
            Jobs with highest engagement and conversion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Job Title</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Applications</th>
                  <th className="text-left p-2">Views</th>
                  <th className="text-left p-2">Conversion Rate</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Time to Fill</th>
                </tr>
              </thead>
              <tbody>
                {data.topJobs.map(job => (
                  <tr key={job.id} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{job.title}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{job.category}</Badge>
                    </td>
                    <td className="p-2">{getStatusBadge(job.status)}</td>
                    <td className="p-2">
                      <div className="font-medium">{job.applications}</div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {job.views.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          job.conversionRate >= 20
                            ? 'default'
                            : job.conversionRate >= 10
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {job.conversionRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatCurrency(job.budget)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatTime(job.timeToFill)}
                      </div>
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
