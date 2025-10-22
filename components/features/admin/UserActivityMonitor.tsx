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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Activity,
  Eye,
  MousePointer,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  Heart,
} from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'contractor' | 'event_manager' | 'admin';
  activity_type: string;
  activity_description: string;
  timestamp: string;
  session_duration: number;
  page_views: number;
  actions_count: number;
  satisfaction_rating?: number;
  feedback?: string;
  location: string;
  device_type: string;
  browser: string;
}

interface ActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionTime: number;
  totalPageViews: number;
  bounceRate: number;
  satisfactionScore: number;
  topActivities: Array<{
    activity: string;
    count: number;
    percentage: number;
  }>;
  userEngagement: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    pageViews: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locationBreakdown: Array<{
    location: string;
    users: number;
    sessions: number;
  }>;
}

interface UserFeedback {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  feedback: string;
  job_id: string;
  job_title: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserActivityMonitor() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>(
    []
  );
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: '24h',
    userRole: 'all',
    activityType: 'all',
    search: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [activitiesResponse, metricsResponse, feedbackResponse] =
        await Promise.all([
          fetch(`/api/admin/users/activity?timeRange=${filters.timeRange}`),
          fetch('/api/admin/users/activity/metrics'),
          fetch('/api/admin/users/feedback'),
        ]);

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities || []);
        setFilteredActivities(activitiesData.activities || []);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.feedback || []);
      }
    } catch (error) {
      console.error('Error loading user activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.timeRange]);

  useEffect(() => {
    let filtered = activities;

    if (filters.userRole !== 'all') {
      filtered = filtered.filter(
        activity => activity.user_role === filters.userRole
      );
    }

    if (filters.activityType !== 'all') {
      filtered = filtered.filter(
        activity => activity.activity_type === filters.activityType
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        activity =>
          activity.user_name.toLowerCase().includes(searchLower) ||
          activity.activity_description.toLowerCase().includes(searchLower) ||
          activity.user_email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filters]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'job_post':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'job_apply':
        return <MousePointer className="h-4 w-4 text-purple-600" />;
      case 'profile_update':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'search':
        return <Search className="h-4 w-4 text-cyan-600" />;
      case 'feedback':
        return <MessageSquare className="h-4 w-4 text-pink-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'contractor':
        return <Badge variant="default">Contractor</Badge>;
      case 'event_manager':
        return <Badge variant="secondary">Event Manager</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user activity data...</span>
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
            Monitor user behavior, engagement, and satisfaction metrics
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalUsers} total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Session Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metrics.averageSessionTime / 60)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Average session duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalPageViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bounceRate.toFixed(1)}% bounce rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfaction
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.satisfactionScore.toFixed(1)}/5
              </div>
              <p className="text-xs text-muted-foreground">
                Average user rating
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter user activity data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select
                value={filters.timeRange}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, timeRange: value }))
                }
              >
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium">User Role</label>
              <Select
                value={filters.userRole}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, userRole: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="contractor">Contractors</SelectItem>
                  <SelectItem value="event_manager">Event Managers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Activity Type</label>
              <Select
                value={filters.activityType}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, activityType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="job_post">Job Post</SelectItem>
                  <SelectItem value="job_apply">Job Apply</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadData} variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Recent Activity ({filteredActivities.length})
              </CardTitle>
              <CardDescription>Real-time user activity feed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {activity.user_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.user_email}
                          </div>
                          {getRoleBadge(activity.user_role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActivityIcon(activity.activity_type)}
                          <span className="capitalize">
                            {activity.activity_type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {activity.activity_description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {Math.round(activity.session_duration / 60)}m
                          </div>
                          <div className="text-muted-foreground">
                            {activity.page_views} views
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.satisfaction_rating ? (
                          <div
                            className={`font-medium ${getSatisfactionColor(activity.satisfaction_rating)}`}
                          >
                            {activity.satisfaction_rating}/5
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Over Time</CardTitle>
                <CardDescription>
                  Daily active users and sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>User devices and browsers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics?.deviceBreakdown.map((entry, index) => (
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
              <CardTitle>Top Activities</CardTitle>
              <CardDescription>Most common user activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topActivities.map((activity, index) => (
                  <div
                    key={activity.activity}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {activity.activity.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.count} occurrences
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {activity.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback ({feedback.length})</CardTitle>
              <CardDescription>
                User satisfaction ratings and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{item.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.job_title} •{' '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`font-medium ${getSatisfactionColor(item.rating)}`}
                        >
                          {item.rating}/5
                        </div>
                        <Badge
                          variant={
                            item.status === 'resolved' ? 'default' : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>User activity by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.locationBreakdown.map(location => (
                    <div
                      key={location.location}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{location.location}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.sessions} sessions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {location.users} users
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(location.sessions / location.users || 0).toFixed(1)}{' '}
                          avg sessions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>User Growth</span>
                    </div>
                    <div className="text-green-600 font-medium">+12.5%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span>Engagement Rate</span>
                    </div>
                    <div className="text-blue-600 font-medium">68.2%</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span>Satisfaction Score</span>
                    </div>
                    <div className="text-yellow-600 font-medium">4.2/5</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>Avg Session Time</span>
                    </div>
                    <div className="text-purple-600 font-medium">
                      {Math.round((metrics?.averageSessionTime || 0) / 60)}m
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
