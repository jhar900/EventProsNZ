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
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  Target,
  Award,
  Calendar,
} from 'lucide-react';

interface RevenueData {
  date: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  transactionRevenue: number;
  refunds: number;
  netRevenue: number;
}

interface SubscriptionData {
  plan: string;
  subscribers: number;
  revenue: number;
  churnRate: number;
  growthRate: number;
}

interface RevenueAnalyticsData {
  revenue: RevenueData[];
  subscriptions: SubscriptionData[];
  summary: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageTransactionValue: number;
    revenueGrowth: number;
    churnRate: number;
    lifetimeValue: number;
  };
  trends: {
    revenueTrend: 'up' | 'down' | 'stable';
    subscriptionTrend: 'up' | 'down' | 'stable';
    churnTrend: 'up' | 'down' | 'stable';
  };
  forecast: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('revenue');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/revenue?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading revenue analytics:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading revenue analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No revenue data available</p>
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
            Revenue Analytics
          </h2>
          <p className="text-muted-foreground">
            Revenue tracking, subscription analytics, and forecasting
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.revenueTrend)}
              <span className={getTrendColor(data.trends.revenueTrend)}>
                {data.summary.revenueGrowth.toFixed(1)}% growth
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.monthlyRecurringRevenue)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.subscriptionTrend)}
              <span className={getTrendColor(data.trends.subscriptionTrend)}>
                {data.trends.subscriptionTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Transaction
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.averageTransactionValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.lifetimeValue)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.churnTrend)}
              <span className={getTrendColor(data.trends.churnTrend)}>
                {data.summary.churnRate.toFixed(1)}% churn
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Revenue Forecast</span>
          </CardTitle>
          <CardDescription>
            Predicted revenue based on current trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(data.forecast.nextMonth)}
              </div>
              <div className="text-sm text-muted-foreground">Next Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(data.forecast.nextQuarter)}
              </div>
              <div className="text-sm text-muted-foreground">Next Quarter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {data.forecast.confidence.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Total revenue and breakdown by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={value => [
                      formatCurrency(Number(value)),
                      'Revenue',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Total Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="subscriptionRevenue"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Subscription Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="transactionRevenue"
                    stackId="3"
                    stroke="#ff7300"
                    fill="#ff7300"
                    name="Transaction Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Revenue breakdown by subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.subscriptions}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {data.subscriptions.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [
                      formatCurrency(Number(value)),
                      'Revenue',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
          <CardDescription>
            Detailed subscription plan performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.subscriptions.map((subscription, index) => (
              <div key={subscription.plan} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{subscription.plan}</h3>
                  <Badge variant="outline">
                    {formatCurrency(subscription.revenue)}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Subscribers</div>
                    <div className="font-medium">
                      {subscription.subscribers.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-medium">
                      {formatCurrency(subscription.revenue)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Churn Rate</div>
                    <div className="font-medium">
                      {subscription.churnRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Growth Rate</div>
                    <div className="font-medium">
                      {subscription.growthRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Net Revenue vs Refunds */}
      <Card>
        <CardHeader>
          <CardTitle>Net Revenue vs Refunds</CardTitle>
          <CardDescription>
            Revenue after refunds and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={value => [formatCurrency(Number(value)), 'Amount']}
                />
                <Bar dataKey="netRevenue" fill="#00c49f" name="Net Revenue" />
                <Bar dataKey="refunds" fill="#ff7300" name="Refunds" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
