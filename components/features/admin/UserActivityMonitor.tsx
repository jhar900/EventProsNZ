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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  User,
  Clock,
  MapPin,
  Monitor,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    role: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ActivityFilters {
  userId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export default function UserActivityMonitor() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const { fetchUserActivity, exportReport } = useAdmin();

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const activityFilters = {
        ...filters,
        type: selectedType === 'all' ? undefined : selectedType,
      };

      const result = await fetchUserActivity(activityFilters);
      if (result) {
        setActivities(result.activities || []);
        setSuspiciousActivities(result.suspiciousActivities || []);
        setSummary(result.summary || null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load activity data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
  }, [filters, selectedType]);

  const handleExport = async () => {
    try {
      const blob = await exportReport('user_activity', 'csv');
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <User className="h-4 w-4 text-gray-600" />;
      case 'profile_update':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'search':
        return <Search className="h-4 w-4 text-purple-600" />;
      case 'location_access':
        return <MapPin className="h-4 w-4 text-orange-600" />;
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const colors = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      profile_update: 'bg-blue-100 text-blue-800',
      search: 'bg-purple-100 text-purple-800',
      location_access: 'bg-orange-100 text-orange-800',
      suspicious: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.users.email.toLowerCase().includes(searchLower) ||
        activity.users.profiles.first_name
          .toLowerCase()
          .includes(searchLower) ||
        activity.users.profiles.last_name.toLowerCase().includes(searchLower) ||
        activity.activity_type.toLowerCase().includes(searchLower) ||
        activity.ip_address.includes(searchTerm)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading activity data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            User Activity Monitor
          </h1>
          <p className="text-muted-foreground">
            Monitor user activities and detect suspicious behavior
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={loadActivityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Activities
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalActivities}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Suspicious Activities
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.suspiciousActivities}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.uniqueIPs}</div>
              <p className="text-xs text-muted-foreground">
                Different locations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspicious Activities Alert */}
      {suspiciousActivities.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <Shield className="h-5 w-5" />
              <span>Suspicious Activities Detected</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              {suspiciousActivities.length} suspicious activities require
              immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspiciousActivities.slice(0, 3).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">{activity.type}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{activity.description}</span>
                  <span className="text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {suspiciousActivities.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{suspiciousActivities.length - 3} more suspicious activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users, activities..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="location_access">
                    Location Access
                  </SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {activities.length}{' '}
            activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActivityIcon(activity.activity_type)}
                        <div>
                          <div className="font-medium">
                            {activity.users.profiles.first_name}{' '}
                            {activity.users.profiles.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.users.email}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.users.role}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {activity.activity_data?.description ||
                          activity.activity_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActivityBadge(activity.activity_type)}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {activity.ip_address}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {activity.user_agent}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No activities found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
