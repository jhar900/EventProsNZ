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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Target,
  PieChart,
  Clock,
  Smartphone,
  Monitor,
} from 'lucide-react';

// Import all analytics components
import RealTimeMetrics from './RealTimeMetrics';
import UserGrowthAnalytics from './UserGrowthAnalytics';
import RevenueAnalytics from './RevenueAnalytics';
import ContractorPerformance from './ContractorPerformance';
import EventAnalytics from './EventAnalytics';
import JobBoardAnalytics from './JobBoardAnalytics';
import GeographicAnalytics from './GeographicAnalytics';
import ServiceCategoryAnalytics from './ServiceCategoryAnalytics';
import DateRangeFilter from './DateRangeFilter';
import ExportManager from './ExportManager';
import DashboardCustomizer from './DashboardCustomizer';
import MobileAdminInterface from './MobileAdminInterface';

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Array<{
    id: string;
    type: string;
    enabled: boolean;
    position: number;
  }>;
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export default function AdvancedAnalyticsDashboard({
  className,
}: AdvancedAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [dashboardLayout, setDashboardLayout] =
    useState<DashboardLayout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (options: any) => {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Export failed');
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  const handleLayoutChange = (layout: DashboardLayout) => {
    setDashboardLayout(layout);
  };

  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    // Handle widget toggle
    console.log('Widget toggle:', widgetId, enabled);
  };

  const handleWidgetConfig = (
    widgetId: string,
    config: Record<string, any>
  ) => {
    // Handle widget configuration
    console.log('Widget config:', widgetId, config);
  };

  // Mobile view
  if (isMobile) {
    return <MobileAdminInterface className={className} />;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Advanced Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics and insights
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
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <ExportManager onExport={handleExport} />
          <DashboardCustomizer
            onLayoutChange={handleLayoutChange}
            onWidgetToggle={handleWidgetToggle}
            onWidgetConfig={handleWidgetConfig}
            currentLayout={dashboardLayout || undefined}
          />
        </div>
      </div>

      {/* Last Updated */}
      <div className="mb-4 text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Real-time</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger
            value="contractors"
            className="flex items-center space-x-2"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Contractors</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger
            value="geographic"
            className="flex items-center space-x-2"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Geographic</span>
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="flex items-center space-x-2"
          >
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Growth</span>
                </CardTitle>
                <CardDescription>
                  User acquisition and retention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,345</div>
                <p className="text-sm text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Revenue</span>
                </CardTitle>
                <CardDescription>Total platform revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,678</div>
                <p className="text-sm text-muted-foreground">
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Events</span>
                </CardTitle>
                <CardDescription>Event creation and completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-sm text-muted-foreground">
                  +15.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common analytics tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 grid-cols-2">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Download className="h-6 w-6 mb-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Settings className="h-6 w-6 mb-2" />
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Platform health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache</span>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Real-time Metrics Tab */}
        <TabsContent value="realtime">
          <RealTimeMetrics />
        </TabsContent>

        {/* User Growth Tab */}
        <TabsContent value="users">
          <UserGrowthAnalytics />
        </TabsContent>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue">
          <RevenueAnalytics />
        </TabsContent>

        {/* Contractor Performance Tab */}
        <TabsContent value="contractors">
          <ContractorPerformance />
        </TabsContent>

        {/* Event Analytics Tab */}
        <TabsContent value="events">
          <EventAnalytics />
        </TabsContent>

        {/* Geographic Analytics Tab */}
        <TabsContent value="geographic">
          <GeographicAnalytics />
        </TabsContent>

        {/* Service Categories Tab */}
        <TabsContent value="categories">
          <ServiceCategoryAnalytics />
        </TabsContent>
      </Tabs>

      {/* Date Range Filter Sidebar */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="fixed bottom-4 right-4">
            <Clock className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Choose the time period for your analytics
            </DialogDescription>
          </DialogHeader>
          <DateRangeFilter
            onDateRangeChange={range => {
              console.log('Date range changed:', range);
            }}
            onPresetChange={preset => {
              console.log('Preset changed:', preset);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
