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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  RefreshCw,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface ConversionMetrics {
  totalApplications: number;
  totalHires: number;
  conversionRate: number;
  averageTimeToHire: number;
  averageApplicationValue: number;
  funnelMetrics: {
    views: number;
    applications: number;
    interviews: number;
    offers: number;
    hires: number;
  };
  conversionTrends: Array<{
    date: string;
    applications: number;
    hires: number;
    conversionRate: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    applications: number;
    hires: number;
    conversionRate: number;
    averageValue: number;
  }>;
  topPerformingJobs: Array<{
    jobId: string;
    title: string;
    applications: number;
    hires: number;
    conversionRate: number;
    timeToHire: number;
  }>;
  userJourney: Array<{
    step: string;
    users: number;
    dropoffRate: number;
    averageTime: number;
  }>;
}

interface ApplicationFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  averageTime: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ApplicationConversionTracker() {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [funnel, setFunnel] = useState<ApplicationFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const loadConversionData = async () => {
    try {
      setIsLoading(true);
      const [metricsResponse, funnelResponse] = await Promise.all([
        fetch(`/api/admin/jobs/conversion-metrics?period=${timeRange}`),
        fetch('/api/admin/jobs/conversion-funnel'),
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json();
        setFunnel(funnelData.funnel || []);
      }
    } catch (error) {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversionData();
  }, [timeRange]);

  const exportConversionReport = async () => {
    try {
      const response = await fetch(
        '/api/admin/jobs/reports?type=conversion&format=pdf'
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversion-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Error handled
    }
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDropoffColor = (rate: number) => {
    if (rate <= 20) return 'text-green-600';
    if (rate <= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading conversion analytics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No conversion data available</p>
          <Button onClick={loadConversionData} className="mt-4">
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
            Application Conversion Tracker
          </h1>
          <p className="text-muted-foreground">
            Track application-to-hire conversion rates and optimize the hiring
            process
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
          <Button onClick={exportConversionReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadConversionData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalApplications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalHires} successful hires
            </p>
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
            <div
              className={`text-2xl font-bold ${getConversionColor(metrics.conversionRate)}`}
            >
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Application to hire rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageTimeToHire} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to hire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Application Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.averageApplicationValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Average job value</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>
            Conversion rates at each stage of the hiring process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnel.map((stage, index) => (
              <div
                key={stage.stage}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{stage.stage}</div>
                    <div className="text-sm text-muted-foreground">
                      {stage.averageTime} days avg
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stage.count.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stage.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Conversion
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getDropoffColor(stage.dropoffRate)}`}
                    >
                      {stage.dropoffRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Dropoff</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Trends</CardTitle>
                <CardDescription>
                  Application and hire trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.conversionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="hires"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate Over Time</CardTitle>
                <CardDescription>
                  Application to hire conversion rate trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.conversionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={value => [`${value}%`, 'Conversion Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversionRate"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Funnel Visualization</CardTitle>
              <CardDescription>
                Visual representation of the application funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnel} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Trends Analysis</CardTitle>
              <CardDescription>
                Detailed analysis of conversion patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Best Performing Day</span>
                    </div>
                    <div className="text-green-600 font-bold">Monday</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Peak Application Time</span>
                    </div>
                    <div className="text-blue-600 font-bold">2-4 PM</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Highest Dropoff</span>
                    </div>
                    <div className="text-yellow-600 font-bold">
                      Interview Stage
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Conversion Goal</span>
                    </div>
                    <div className="text-purple-600 font-bold">25%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Conversion rates by job category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.categoryPerformance.map((category, index) => (
                  <div
                    key={category.category}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">
                        {category.category}
                      </h3>
                      <Badge variant="outline">
                        {category.conversionRate.toFixed(1)}% conversion
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Applications
                        </div>
                        <div className="font-medium">
                          {category.applications}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Hires</div>
                        <div className="font-medium">{category.hires}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Avg Value</div>
                        <div className="font-medium">
                          ${category.averageValue.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Conversion</div>
                        <div
                          className={`font-medium ${getConversionColor(category.conversionRate)}`}
                        >
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
                Jobs with highest conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topPerformingJobs.map((job, index) => (
                  <div key={job.jobId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{job.title}</h3>
                      <Badge variant="outline">
                        {job.conversionRate.toFixed(1)}% conversion
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Applications
                        </div>
                        <div className="font-medium">{job.applications}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Hires</div>
                        <div className="font-medium">{job.hires}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Time to Hire
                        </div>
                        <div className="font-medium">{job.timeToHire} days</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Conversion</div>
                        <div
                          className={`font-medium ${getConversionColor(job.conversionRate)}`}
                        >
                          {job.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Data-driven suggestions to improve conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Improve Job Descriptions
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Jobs with detailed descriptions have 23% higher
                        conversion rates. Consider adding more specific
                        requirements and expectations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Optimize Application Process
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Reduce application form fields by 30% to decrease
                        dropoff rates. Current form has 8 fields, optimal is 5-6
                        fields.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">
                        Speed Up Response Time
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Jobs with responses within 24 hours have 40% higher
                        conversion rates. Consider implementing automated
                        acknowledgment emails.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">
                        A/B Test Application Flow
                      </h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Test different application layouts to identify the most
                        effective design for your target audience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
