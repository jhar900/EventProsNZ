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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Users,
  Target,
  Award,
  Globe,
} from 'lucide-react';

interface GeographicData {
  location: string;
  users: number;
  contractors: number;
  events: number;
  jobs: number;
  revenue: number;
  growth: number;
  density: number;
}

interface RegionData {
  region: string;
  countries: string[];
  totalUsers: number;
  totalContractors: number;
  totalEvents: number;
  totalRevenue: number;
  averageGrowth: number;
}

interface GeographicAnalyticsData {
  locations: GeographicData[];
  regions: RegionData[];
  summary: {
    totalLocations: number;
    topLocation: string;
    averageDensity: number;
    totalRevenue: number;
    globalGrowth: number;
  };
  trends: {
    userDistributionTrend: 'up' | 'down' | 'stable';
    contractorDistributionTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
  };
  heatmap: Array<{
    location: string;
    intensity: number;
    category: 'users' | 'contractors' | 'events' | 'revenue';
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function GeographicAnalytics() {
  const [data, setData] = useState<GeographicAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/geographic?period=${timeRange}&region=${selectedRegion}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading geographic analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedRegion]);

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

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    if (intensity >= 20) return 'bg-green-500';
    return 'bg-blue-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading geographic analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No geographic data available</p>
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
            Geographic Analytics
          </h2>
          <p className="text-muted-foreground">
            User and contractor distribution, regional performance, and
            geographic trends
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="north-america">North America</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
              <SelectItem value="latin-america">Latin America</SelectItem>
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
              Total Locations
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalLocations}
            </div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.topLocation}</div>
            <p className="text-xs text-muted-foreground">Highest activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Density</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageDensity.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Users per location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Growth</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.globalGrowth.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(data.trends.userDistributionTrend)}
              <span
                className={getTrendColor(data.trends.userDistributionTrend)}
              >
                {data.trends.userDistributionTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Distribution by Location */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Location</CardTitle>
            <CardDescription>User count by geographic location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.locations.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8884d8" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contractor Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contractor Distribution</CardTitle>
            <CardDescription>
              Contractor count by geographic location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.locations.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="contractors"
                    fill="#82ca9d"
                    name="Contractors"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Performance</CardTitle>
          <CardDescription>Performance metrics by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.regions.map((region, index) => (
              <div key={region.region} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{region.region}</h3>
                  <Badge variant="outline">
                    {region.averageGrowth.toFixed(1)}% growth
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Users</div>
                    <div className="font-medium">
                      {region.totalUsers.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Contractors</div>
                    <div className="font-medium">
                      {region.totalContractors.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Events</div>
                    <div className="font-medium">
                      {region.totalEvents.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-medium">
                      {formatCurrency(region.totalRevenue)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Countries</div>
                    <div className="font-medium">{region.countries.length}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Countries: {region.countries.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Location</CardTitle>
          <CardDescription>
            Revenue distribution across geographic locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.locations.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip
                  formatter={value => [
                    formatCurrency(Number(value)),
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" fill="#ff7300" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
          <CardDescription>
            Geographic activity intensity by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['users', 'contractors', 'events', 'revenue'].map(category => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium capitalize">{category}</h4>
                <div className="space-y-1">
                  {data.heatmap
                    .filter(item => item.category === category)
                    .slice(0, 8)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item.location}</span>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded ${getIntensityColor(item.intensity)}`}
                          />
                          <span className="text-sm font-medium">
                            {item.intensity}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Locations</CardTitle>
          <CardDescription>
            Complete geographic performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Users</th>
                  <th className="text-left p-2">Contractors</th>
                  <th className="text-left p-2">Events</th>
                  <th className="text-left p-2">Jobs</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Growth</th>
                  <th className="text-left p-2">Density</th>
                </tr>
              </thead>
              <tbody>
                {data.locations.map((location, index) => (
                  <tr key={location.location} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{location.location}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {location.users.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {location.contractors.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {location.events.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {location.jobs.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {formatCurrency(location.revenue)}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          location.growth >= 20
                            ? 'default'
                            : location.growth >= 10
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {location.growth.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">
                        {location.density.toFixed(1)}
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
