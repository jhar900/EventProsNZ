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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  MapPin,
  Star,
  Clock,
  DollarSign,
  RefreshCw,
  Download,
  Calendar,
  Activity,
  Target,
  Award,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    conversionRate: number;
    averageTimeToFill: number;
    userSatisfaction: number;
    totalRevenue: number;
    geographicDistribution: Array<{
      location: string;
      jobs: number;
      applications: number;
    }>;
  };
  trends: {
    jobPostings: Array<{ date: string; count: number }>;
    applications: Array<{ date: string; count: number }>;
    conversions: Array<{ date: string; rate: number }>;
    satisfaction: Array<{ date: string; rating: number }>;
  };
  categories: Array<{
    name: string;
    jobs: number;
    applications: number;
    conversionRate: number;
    averageBudget: number;
  }>;
  performance: {
    topPerformingJobs: Array<{
      id: string;
      title: string;
      applications: number;
      views: number;
      conversionRate: number;
    }>;
    userEngagement: {
      averageSessionTime: number;
      pageViews: number;
      bounceRate: number;
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/jobs/analytics?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const exportReport = async () => {
    try {
      const response = await fetch('/api/admin/jobs/reports?format=pdf');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-board-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Job Board Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for job board performance
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
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalJobs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overview.activeJobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalApplications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overview.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Fill</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.averageTimeToFill} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to fill
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              User Satisfaction
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.userSatisfaction.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Postings Over Time</CardTitle>
                <CardDescription>Daily job posting trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends.jobPostings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Trends</CardTitle>
                <CardDescription>Daily application submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.applications}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Job distribution by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.overview.geographicDistribution.map((location, index) => (
                  <div
                    key={location.location}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{location.location}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.jobs} jobs, {location.applications}{' '}
                          applications
                        </p>
                      </div>
                      <Badge variant="outline">
                        {(
                          (location.applications / location.jobs) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate Trends</CardTitle>
                <CardDescription>
                  Application to hire conversion over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.conversions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={value => [`${value}%`, 'Conversion Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction Trends</CardTitle>
                <CardDescription>
                  Average satisfaction rating over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.satisfaction}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip
                      formatter={value => [`${value}/5`, 'Satisfaction']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#00c49f"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Job categories by performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.categories.map((category, index) => (
                  <div key={category.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge variant="outline">
                        {category.conversionRate.toFixed(1)}% conversion
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Jobs</div>
                        <div className="font-medium">{category.jobs}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Applications
                        </div>
                        <div className="font-medium">
                          {category.applications}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Avg Budget</div>
                        <div className="font-medium">
                          ${category.averageBudget.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Conversion</div>
                        <div className="font-medium">
                          {category.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Jobs</CardTitle>
              <CardDescription>
                Jobs with highest engagement and conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.topPerformingJobs.map((job, index) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{job.title}</h3>
                      <Badge variant="outline">
                        {job.conversionRate.toFixed(1)}% conversion
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Applications
                        </div>
                        <div className="font-medium">{job.applications}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Views</div>
                        <div className="font-medium">{job.views}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Conversion Rate
                        </div>
                        <div className="font-medium">
                          {job.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>
                Overall platform engagement statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(
                      data.performance.userEngagement.averageSessionTime / 60
                    )}
                    m
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Session Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.performance.userEngagement.pageViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Page Views
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.performance.userEngagement.bounceRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bounce Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Job and application distribution by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.overview.geographicDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#8884d8" name="Jobs" />
                  <Bar
                    dataKey="applications"
                    fill="#82ca9d"
                    name="Applications"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
