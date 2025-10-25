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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  RefreshCw,
  Download,
  Globe,
  Building,
  Home,
  Car,
} from 'lucide-react';

interface GeographicData {
  location: string;
  region: string;
  country: string;
  jobs: number;
  applications: number;
  users: number;
  contractors: number;
  eventManagers: number;
  conversionRate: number;
  averageBudget: number;
  satisfaction: number;
  growth: number;
  categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

interface RegionalMetrics {
  totalLocations: number;
  topPerformingRegion: string;
  fastestGrowingRegion: string;
  averageConversionRate: number;
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
  regionalDistribution: Array<{
    region: string;
    jobs: number;
    applications: number;
    users: number;
    growth: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    locations: number;
    totalJobs: number;
    averageBudget: number;
  }>;
  trends: Array<{
    date: string;
    region: string;
    jobs: number;
    applications: number;
    users: number;
  }>;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

export default function GeographicAnalytics() {
  const [data, setData] = useState<GeographicData[]>([]);
  const [metrics, setMetrics] = useState<RegionalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const loadGeographicData = async () => {
    try {
      setIsLoading(true);
      const [dataResponse, metricsResponse] = await Promise.all([
        fetch(
          `/api/admin/jobs/geographic?period=${timeRange}&region=${selectedRegion}`
        ),
        fetch('/api/admin/jobs/geographic/metrics'),
      ]);

      if (dataResponse.ok) {
        const geographicData = await dataResponse.json();
        setData(geographicData.locations || []);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGeographicData();
  }, [timeRange, selectedRegion]);

  const exportGeographicReport = async () => {
    try {
      const response = await fetch(
        '/api/admin/jobs/reports?type=geographic&format=pdf'
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geographic-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Error handled
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getLocationIcon = (location: string) => {
    if (location.includes('City') || location.includes('Town'))
      return <Building className="h-4 w-4" />;
    if (location.includes('Region') || location.includes('State'))
      return <Globe className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading geographic analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Geographic Analytics
          </h1>
          <p className="text-muted-foreground">
            Analyze job distribution, user activity, and performance by location
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
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportGeographicReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadGeographicData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Locations
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLocations}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Region</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.topPerformingRegion}
              </div>
              <p className="text-xs text-muted-foreground">
                Best performing region
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fastest Growing
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.fastestGrowingRegion}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest growth rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Conversion
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageConversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Regional average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>
                  Jobs and applications by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.regionalDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
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

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>User count by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.regionalDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ region, users }) => `${region}: ${users}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {metrics?.regionalDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Location Performance</CardTitle>
              <CardDescription>
                Top performing locations by metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.slice(0, 10).map((location, index) => (
                  <div
                    key={location.location}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getLocationIcon(location.location)}
                        <div>
                          <div className="font-medium">{location.location}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.region}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getGrowthIcon(location.growth)}
                        <span
                          className={`text-sm font-medium ${getGrowthColor(location.growth)}`}
                        >
                          {location.growth > 0 ? '+' : ''}
                          {location.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Jobs</div>
                        <div className="font-medium">{location.jobs}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Applications
                        </div>
                        <div className="font-medium">
                          {location.applications}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Users</div>
                        <div className="font-medium">{location.users}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Conversion</div>
                        <div className="font-medium">
                          {location.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Detailed breakdown by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.map(location => (
                  <div
                    key={location.location}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getLocationIcon(location.location)}
                        <div>
                          <div className="font-medium">{location.location}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.region}, {location.country}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {location.conversionRate.toFixed(1)}% conversion
                        </Badge>
                        <Badge
                          variant={
                            location.growth > 0 ? 'default' : 'secondary'
                          }
                        >
                          {location.growth > 0 ? '+' : ''}
                          {location.growth.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {location.jobs}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Jobs
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {location.applications}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Applications
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {location.users}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Users
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          ${location.averageBudget.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg Budget
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">
                        Top Categories
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {location.categories.slice(0, 3).map(category => (
                          <Badge key={category.category} variant="outline">
                            {category.category} (
                            {category.percentage.toFixed(1)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Trends</CardTitle>
              <CardDescription>
                Growth patterns by region over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics?.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="jobs"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#ff7300"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Service categories by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.categoryDistribution.map(category => (
                  <div
                    key={category.category}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">
                        {category.category}
                      </h3>
                      <Badge variant="outline">
                        {category.locations} locations
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Total Jobs</div>
                        <div className="font-medium">{category.totalJobs}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Avg Budget</div>
                        <div className="font-medium">
                          ${category.averageBudget.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Locations</div>
                        <div className="font-medium">{category.locations}</div>
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
              <CardTitle>Regional Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">
                          Best Conversion Rate
                        </div>
                        <div className="text-sm text-green-700">
                          {
                            data.reduce((max, location) =>
                              location.conversionRate > max.conversionRate
                                ? location
                                : max
                            ).location
                          }
                        </div>
                      </div>
                      <div className="text-green-600 font-bold">
                        {Math.max(...data.map(l => l.conversionRate)).toFixed(
                          1
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">
                          Highest Job Volume
                        </div>
                        <div className="text-sm text-blue-700">
                          {
                            data.reduce((max, location) =>
                              location.jobs > max.jobs ? location : max
                            ).location
                          }
                        </div>
                      </div>
                      <div className="text-blue-600 font-bold">
                        {Math.max(...data.map(l => l.jobs))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-yellow-900">
                          Fastest Growing
                        </div>
                        <div className="text-sm text-yellow-700">
                          {
                            data.reduce((max, location) =>
                              location.growth > max.growth ? location : max
                            ).location
                          }
                        </div>
                      </div>
                      <div className="text-yellow-600 font-bold">
                        +{Math.max(...data.map(l => l.growth)).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-purple-900">
                          Highest Satisfaction
                        </div>
                        <div className="text-sm text-purple-700">
                          {
                            data.reduce((max, location) =>
                              location.satisfaction > max.satisfaction
                                ? location
                                : max
                            ).location
                          }
                        </div>
                      </div>
                      <div className="text-purple-600 font-bold">
                        {Math.max(...data.map(l => l.satisfaction)).toFixed(1)}
                        /5
                      </div>
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
