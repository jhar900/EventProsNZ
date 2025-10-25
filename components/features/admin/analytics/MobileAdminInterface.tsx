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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Menu,
  X,
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
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react';

interface MobileMetric {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
}

interface MobileChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: any[];
  height: number;
}

interface MobileAdminInterfaceProps {
  className?: string;
}

const MOBILE_METRICS: MobileMetric[] = [
  {
    id: 'users',
    title: 'Total Users',
    value: '12,345',
    change: 12.5,
    trend: 'up',
    icon: Users,
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$45,678',
    change: 8.2,
    trend: 'up',
    icon: DollarSign,
  },
  {
    id: 'events',
    title: 'Events',
    value: '1,234',
    change: -2.1,
    trend: 'down',
    icon: Calendar,
  },
  {
    id: 'contractors',
    title: 'Contractors',
    value: '567',
    change: 15.3,
    trend: 'up',
    icon: Target,
  },
];

const MOBILE_CHARTS: MobileChart[] = [
  {
    id: 'user-growth',
    title: 'User Growth',
    type: 'line',
    data: [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 120 },
      { name: 'Mar', value: 140 },
      { name: 'Apr', value: 160 },
      { name: 'May', value: 180 },
      { name: 'Jun', value: 200 },
    ],
    height: 200,
  },
  {
    id: 'revenue-breakdown',
    title: 'Revenue Breakdown',
    type: 'pie',
    data: [
      { name: 'Subscriptions', value: 60, color: '#0088FE' },
      { name: 'Transactions', value: 30, color: '#00C49F' },
      { name: 'Other', value: 10, color: '#FFBB28' },
    ],
    height: 200,
  },
];

export default function MobileAdminInterface({
  className,
}: MobileAdminInterfaceProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
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

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  if (!isMobile && !isTablet) {
    return null; // Don't render on desktop
  }

  return (
    <div className={className}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Analytics</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Analytics Menu</SheetTitle>
                  <SheetDescription>
                    Navigate through different analytics views
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'revenue', label: 'Revenue', icon: DollarSign },
                    { id: 'events', label: 'Events', icon: Calendar },
                    { id: 'contractors', label: 'Contractors', icon: Target },
                    { id: 'geographic', label: 'Geographic', icon: MapPin },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={selectedView === item.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedView(item.id);
                          setIsMenuOpen(false);
                        }}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-4 space-y-4">
        {/* Quick Metrics */}
        <div className="grid gap-3 grid-cols-2">
          {MOBILE_METRICS.map(metric => {
            const Icon = metric.icon;
            return (
              <Card key={metric.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span
                        className={`text-xs ${getTrendColor(metric.trend)}`}
                      >
                        {metric.change > 0 ? '+' : ''}
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {metric.title}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Time Range</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select defaultValue="30d">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          {MOBILE_CHARTS.map(chart => (
            <Card key={chart.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">
                      {chart.type === 'line'
                        ? 'Line Chart'
                        : chart.type === 'bar'
                          ? 'Bar Chart'
                          : 'Pie Chart'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Touch to expand
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 grid-cols-2">
              <Button variant="outline" size="sm" className="h-10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="h-10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {[
                {
                  action: 'New user registered',
                  time: '2 min ago',
                  type: 'user',
                },
                { action: 'Event completed', time: '5 min ago', type: 'event' },
                {
                  action: 'Payment received',
                  time: '10 min ago',
                  type: 'payment',
                },
                {
                  action: 'Contractor verified',
                  time: '15 min ago',
                  type: 'contractor',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">{activity.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
        <div className="flex items-center justify-around">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'events', label: 'Events', icon: Calendar },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={selectedView === item.id ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => setSelectedView(item.id)}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Device Indicator */}
      <div className="fixed top-16 right-4 z-40">
        <Badge variant="outline" className="bg-white">
          {isMobile ? (
            <>
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile
            </>
          ) : (
            <>
              <Tablet className="h-3 w-3 mr-1" />
              Tablet
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
