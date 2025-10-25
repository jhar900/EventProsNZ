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
  Activity,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  location?: {
    city: string;
    country: string;
    region: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
}

interface UserActivityMonitorProps {
  onViewDetails?: (activityId: string) => void;
  loading?: boolean;
}

export default function UserActivityMonitor({
  onViewDetails,
  loading = false,
}: UserActivityMonitorProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: '1',
        user_id: 'user1',
        user_email: 'john.doe@example.com',
        user_name: 'John Doe',
        action: 'login',
        details: { method: 'email', success: true },
        ip_address: '192.168.1.1',
        user_agent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: '2024-01-15T10:30:00Z',
        location: {
          city: 'Auckland',
          country: 'New Zealand',
          region: 'Auckland',
        },
        device: {
          type: 'desktop',
          browser: 'Chrome',
          os: 'Windows 10',
        },
      },
      {
        id: '2',
        user_id: 'user2',
        user_email: 'jane.smith@example.com',
        user_name: 'Jane Smith',
        action: 'profile_update',
        details: { fields: ['first_name', 'bio'], success: true },
        ip_address: '192.168.1.2',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        created_at: '2024-01-15T09:15:00Z',
        location: {
          city: 'Wellington',
          country: 'New Zealand',
          region: 'Wellington',
        },
        device: {
          type: 'mobile',
          browser: 'Safari',
          os: 'iOS 14',
        },
      },
      {
        id: '3',
        user_id: 'user3',
        user_email: 'bob.wilson@example.com',
        user_name: 'Bob Wilson',
        action: 'failed_login',
        details: { method: 'email', reason: 'invalid_password', attempts: 3 },
        ip_address: '192.168.1.3',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: '2024-01-15T08:45:00Z',
        location: {
          city: 'Christchurch',
          country: 'New Zealand',
          region: 'Canterbury',
        },
        device: {
          type: 'desktop',
          browser: 'Firefox',
          os: 'macOS',
        },
      },
    ];
    setActivities(mockActivities);
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.action === filter;
    const matchesSearch =
      search === '' ||
      activity.user_name.toLowerCase().includes(search.toLowerCase()) ||
      activity.user_email.toLowerCase().includes(search.toLowerCase()) ||
      activity.action.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'profile_update':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'password_change':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      login: 'default',
      failed_login: 'destructive',
      profile_update: 'secondary',
      password_change: 'outline',
    } as const;

    return (
      <Badge variant={variants[action as keyof typeof variants] || 'secondary'}>
        {action.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Monitor
              </CardTitle>
              <CardDescription>
                Monitor user activities, login attempts, and system interactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredActivities.length} Activities
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter">Action Type</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="password_change">
                    Password Change
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{activity.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      {getActionBadge(activity.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm">
                        {activity.details.success !== undefined && (
                          <span
                            className={
                              activity.details.success
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {activity.details.success ? 'Success' : 'Failed'}
                          </span>
                        )}
                        {activity.details.method && (
                          <div className="text-xs text-muted-foreground">
                            Method: {activity.details.method}
                          </div>
                        )}
                        {activity.details.attempts && (
                          <div className="text-xs text-muted-foreground">
                            Attempts: {activity.details.attempts}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <div className="text-sm">
                          <div>{activity.location.city}</div>
                          <div className="text-xs text-muted-foreground">
                            {activity.location.country}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {activity.device ? (
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(activity.device.type)}
                        <div className="text-sm">
                          <div className="capitalize">
                            {activity.device.type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.device.browser} on {activity.device.os}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {activity.ip_address}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'HH:mm:ss')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails?.(activity.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
