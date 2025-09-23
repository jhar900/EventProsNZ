'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  MousePointer,
  Search,
} from 'lucide-react';
import QueryAnalytics from './QueryAnalytics';
import {
  AnalyticsErrorBoundary,
  AnalyticsChartErrorBoundary,
} from './ErrorBoundary';
import FilterAnalytics from './FilterAnalytics';
import ClickthroughAnalytics from './ClickthroughAnalytics';
import TrendingTerms from './TrendingTerms';
import BehaviorAnalytics from './BehaviorAnalytics';
import EngagementMetrics from './EngagementMetrics';
import PerformanceMonitoring from './PerformanceMonitoring';
import ABTestingDashboard from './ABTestingDashboard';

interface DashboardMetrics {
  totalSearches: number;
  uniqueUsers: number;
  clickThroughRate: number;
  avgResultsPerSearch: number;
  trendingTerms: number;
  performanceScore: number;
}

interface SearchAnalyticsDashboardProps {
  className?: string;
}

export default function SearchAnalyticsDashboard({
  className,
}: SearchAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSearches: 0,
    uniqueUsers: 0,
    clickThroughRate: 0,
    avgResultsPerSearch: 0,
    trendingTerms: 0,
    performanceScore: 0,
  });

  const fetchDashboardMetrics = async () => {
    try {
      setIsLoading(true);

      // Fetch multiple metrics in parallel
      const [queriesRes, ctrRes, trendingRes, performanceRes] =
        await Promise.all([
          fetch(`/api/analytics/search/queries?period=${timePeriod}&limit=1`),
          fetch(`/api/analytics/search/clickthrough?period=${timePeriod}`),
          fetch(`/api/analytics/search/trending?period=${timePeriod}&limit=5`),
          fetch(`/api/analytics/performance/search?period=${timePeriod}`),
        ]);

      const [queriesData, ctrData, trendingData, performanceData] =
        await Promise.all([
          queriesRes.json(),
          ctrRes.json(),
          trendingRes.json(),
          performanceRes.json(),
        ]);

      // Calculate aggregated metrics
      const totalSearches = queriesData.total || 0;
      const uniqueUsers = queriesData.queries?.[0]?.unique_users || 0;
      const clickThroughRate = ctrData.ctr_metrics?.click_through_rate || 0;
      const avgResultsPerSearch = queriesData.queries?.[0]?.avg_results || 0;
      const trendingTerms = trendingData.trending_terms?.length || 0;
      const performanceScore =
        performanceData.performance_metrics?.performance_score || 0;

      setMetrics({
        totalSearches,
        uniqueUsers,
        clickThroughRate,
        avgResultsPerSearch,
        trendingTerms,
        performanceScore,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [timePeriod]);

  const handleRefresh = () => {
    fetchDashboardMetrics();
  };

  const handleExport = () => {
    // TODO: Implement data export functionality
    console.log('Exporting analytics data...');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  return (
    <AnalyticsErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Search Analytics
            </h1>
            <p className="text-muted-foreground">
              Monitor search performance and user behavior
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24h</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Searches
              </CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatNumber(metrics.totalSearches)}
              </div>
              <p className="text-xs text-muted-foreground">
                {timePeriod === 'day'
                  ? 'Last 24 hours'
                  : timePeriod === 'week'
                    ? 'Last 7 days'
                    : timePeriod === 'month'
                      ? 'Last 30 days'
                      : 'Last year'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatNumber(metrics.uniqueUsers)}
              </div>
              <p className="text-xs text-muted-foreground">Active searchers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Click-Through Rate
              </CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatPercentage(metrics.clickThroughRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                Search result engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : metrics.avgResultsPerSearch.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Per search query</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trending Terms
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : metrics.trendingTerms}
              </div>
              <p className="text-xs text-muted-foreground">
                Popular search terms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Performance Score
              </CardTitle>
              <Badge
                variant={
                  metrics.performanceScore > 80
                    ? 'default'
                    : metrics.performanceScore > 60
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {isLoading ? '...' : Math.round(metrics.performanceScore)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatPercentage(metrics.performanceScore)}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="clickthrough">CTR</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <QueryAnalytics timePeriod={timePeriod} />
              <ClickthroughAnalytics timePeriod={timePeriod} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TrendingTerms timePeriod={timePeriod} />
              <PerformanceMonitoring timePeriod={timePeriod} />
            </div>
          </TabsContent>

          <TabsContent value="queries">
            <QueryAnalytics timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="filters">
            <FilterAnalytics timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="clickthrough">
            <ClickthroughAnalytics timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="trending">
            <TrendingTerms timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="behavior">
            <BehaviorAnalytics timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementMetrics timePeriod={timePeriod} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMonitoring timePeriod={timePeriod} />
          </TabsContent>
        </Tabs>
      </div>
    </AnalyticsErrorBoundary>
  );
}
