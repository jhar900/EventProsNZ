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
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Award,
  Users,
} from 'lucide-react';

interface EventData {
  date: string;
  created: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  successRate: number;
  averageDuration: number;
}

interface EventCategoryData {
  category: string;
  totalEvents: number;
  completedEvents: number;
  successRate: number;
  averageBudget: number;
  averageDuration: number;
}

interface EventAnalyticsData {
  events: EventData[];
  categories: EventCategoryData[];
  summary: {
    totalEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    inProgressEvents: number;
    averageSuccessRate: number;
    averageDuration: number;
    totalBudget: number;
  };
  trends: {
    creationTrend: 'up' | 'down' | 'stable';
    completionTrend: 'up' | 'down' | 'stable';
    successTrend: 'up' | 'down' | 'stable';
  };
  topEvents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    budget: number;
    completionDate: string;
    successScore: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EventAnalytics() {
  const [data, setData] = useState<EventAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/events?period=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading event analytics:', error);
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
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
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

  const formatDuration = (days: number) => {
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
        <span className="ml-2">Loading event analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No event data available</p>
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
          <h2 className="text-2xl font-bold tracking-tight">Event Analytics</h2>
          <p className="text-muted-foreground">
            Event creation, completion, and success metrics
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
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalEvents.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.creationTrend)}
              <span className={getTrendColor(data.trends.creationTrend)}>
                {data.trends.creationTrend} creation
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Events
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.completedEvents.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.completionTrend)}
              <span className={getTrendColor(data.trends.completionTrend)}>
                {data.trends.completionTrend} completion
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageSuccessRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.successTrend)}
              <span className={getTrendColor(data.trends.successTrend)}>
                {data.trends.successTrend} success
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(data.summary.averageDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average event duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.inProgressEvents}
            </div>
            <p className="text-xs text-muted-foreground">Active events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.summary.cancelledEvents}
            </div>
            <p className="text-xs text-muted-foreground">Cancelled events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">All events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data.summary.totalBudget / Math.max(data.summary.totalEvents, 1)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per event</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Creation and Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Event Creation and Completion</CardTitle>
            <CardDescription>Event lifecycle over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.events}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Created"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
            <CardDescription>Event success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.events}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={value => [`${value}%`, 'Success Rate']} />
                  <Line
                    type="monotone"
                    dataKey="successRate"
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

      {/* Event Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Event Categories</CardTitle>
          <CardDescription>Performance by event category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categories.map((category, index) => (
              <div key={category.category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.category}</h3>
                  <Badge variant="outline">
                    {category.successRate.toFixed(1)}% success
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Total Events</div>
                    <div className="font-medium">{category.totalEvents}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Completed</div>
                    <div className="font-medium">
                      {category.completedEvents}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Success Rate</div>
                    <div className="font-medium">
                      {category.successRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Avg Budget</div>
                    <div className="font-medium">
                      {formatCurrency(category.averageBudget)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Avg Duration</div>
                    <div className="font-medium">
                      {formatDuration(category.averageDuration)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>Events with highest success scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Success Score</th>
                  <th className="text-left p-2">Completion</th>
                </tr>
              </thead>
              <tbody>
                {data.topEvents.map(event => (
                  <tr key={event.id} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{event.title}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{event.category}</Badge>
                    </td>
                    <td className="p-2">{getStatusBadge(event.status)}</td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatCurrency(event.budget)}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          event.successScore >= 90
                            ? 'default'
                            : event.successScore >= 70
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {event.successScore}/100
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.completionDate).toLocaleDateString()}
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
