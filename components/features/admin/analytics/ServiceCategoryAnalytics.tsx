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
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Target,
  Award,
  Star,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';

interface CategoryTrendData {
  date: string;
  category: string;
  popularity: number;
  bookings: number;
  revenue: number;
  satisfaction: number;
}

interface CategoryPerformanceData {
  category: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  popularityScore: number;
  growthRate: number;
  marketShare: number;
  averagePrice: number;
  completionRate: number;
}

interface CategoryForecastData {
  category: string;
  currentTrend: 'up' | 'down' | 'stable';
  predictedGrowth: number;
  confidence: number;
  nextMonthPrediction: number;
  nextQuarterPrediction: number;
}

interface ServiceCategoryAnalyticsData {
  trends: CategoryTrendData[];
  performance: CategoryPerformanceData[];
  forecasts: CategoryForecastData[];
  summary: {
    totalCategories: number;
    topCategory: string;
    averagePopularity: number;
    totalRevenue: number;
    marketGrowth: number;
  };
  insights: {
    trendingUp: string[];
    trendingDown: string[];
    emerging: string[];
    declining: string[];
  };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
];

export default function ServiceCategoryAnalytics() {
  const [data, setData] = useState<ServiceCategoryAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/categories?period=${timeRange}&category=${selectedCategory}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading service category analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedCategory]);

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

  const getPopularityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPopularityBadge = (score: number) => {
    if (score >= 80)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          High
        </Badge>
      );
    if (score >= 60)
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Medium
        </Badge>
      );
    if (score >= 40)
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Low
        </Badge>
      );
    return <Badge variant="destructive">Very Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading service category analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            No service category data available
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
            Service Category Analytics
          </h2>
          <p className="text-muted-foreground">
            Service category popularity, trends, and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {data.performance.map(category => (
                <SelectItem key={category.category} value={category.category}>
                  {category.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              Total Categories
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              Active service categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.topCategory}</div>
            <p className="text-xs text-muted-foreground">Highest popularity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Popularity
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averagePopularity.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.marketGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall market growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Trending Up</CardTitle>
            <CardDescription>Categories gaining popularity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.trendingUp.map((category, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Trending Down</CardTitle>
            <CardDescription>Categories losing popularity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.trendingDown.map((category, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Emerging</CardTitle>
            <CardDescription>New or growing categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.emerging.map((category, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Declining</CardTitle>
            <CardDescription>Categories in decline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.declining.map((category, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Popularity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Category Popularity Trends</CardTitle>
            <CardDescription>
              Popularity scores over time by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={value => [`${value}`, 'Popularity']} />
                  <Line
                    type="monotone"
                    dataKey="popularity"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>
              Revenue distribution across service categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.performance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                  >
                    {data.performance.map((entry, index) => (
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

      {/* Category Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics by service category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.performance.map((category, index) => (
              <div key={category.category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.category}</h3>
                  <div className="flex items-center space-x-2">
                    {getPopularityBadge(category.popularityScore)}
                    <Badge variant="outline">
                      {category.growthRate.toFixed(1)}% growth
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Bookings</div>
                    <div className="font-medium">
                      {category.totalBookings.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-medium">
                      {formatCurrency(category.totalRevenue)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Rating</div>
                    <div className="font-medium">
                      {category.averageRating.toFixed(1)}/5
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Popularity</div>
                    <div
                      className={`font-medium ${getPopularityColor(category.popularityScore)}`}
                    >
                      {category.popularityScore}/100
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Market Share</div>
                    <div className="font-medium">
                      {category.marketShare.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Avg Price</div>
                    <div className="font-medium">
                      {formatCurrency(category.averagePrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle>Category Forecasts</CardTitle>
          <CardDescription>
            Predicted performance and growth for service categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Current Trend</th>
                  <th className="text-left p-2">Predicted Growth</th>
                  <th className="text-left p-2">Confidence</th>
                  <th className="text-left p-2">Next Month</th>
                  <th className="text-left p-2">Next Quarter</th>
                </tr>
              </thead>
              <tbody>
                {data.forecasts.map(forecast => (
                  <tr key={forecast.category} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{forecast.category}</div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(forecast.currentTrend)}
                        <span className="capitalize">
                          {forecast.currentTrend}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          forecast.predictedGrowth >= 20
                            ? 'default'
                            : forecast.predictedGrowth >= 10
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {forecast.predictedGrowth.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {forecast.confidence.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {forecast.nextMonthPrediction.toFixed(0)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {forecast.nextQuarterPrediction.toFixed(0)}
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
