'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
  Mail,
  CreditCard,
  HelpCircle,
  BarChart3,
} from 'lucide-react';

interface TrialNotificationsProps {
  userId: string;
}

interface TrialNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action: string;
  priority: string;
  created_at: string;
}

interface TrialStatus {
  conversion_status: string;
  days_remaining: number;
  tier: string;
}

export default function TrialNotifications({
  userId,
}: TrialNotificationsProps) {
  const [notifications, setNotifications] = useState<TrialNotification[]>([]);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/trial/notifications?user_id=${userId}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setNotifications(data.notifications || []);
      setTrialStatus(data.trial_status || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch trial notifications'
      );
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      case 'info':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upgrade':
        return <CreditCard className="h-4 w-4" />;
      case 'view-emails':
        return <Mail className="h-4 w-4" />;
      case 'get-help':
        return <HelpCircle className="h-4 w-4" />;
      case 'complete-profile':
        return <CheckCircle className="h-4 w-4" />;
      case 'explore-features':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Trial Notifications
          </CardTitle>
          <CardDescription>
            Important updates and alerts about your trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {notifications.length} notifications
            </div>
            <Button onClick={fetchNotifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trial Status Overview */}
      {trialStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Trial Status</CardTitle>
            <CardDescription>Current trial information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {trialStatus.days_remaining}
                </div>
                <div className="text-sm text-gray-500">Days Remaining</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {trialStatus.tier}
                </div>
                <div className="text-sm text-gray-500">Current Tier</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Badge
                  className={getPriorityColor(trialStatus.conversion_status)}
                >
                  {trialStatus.conversion_status}
                </Badge>
                <div className="text-sm text-gray-500 mt-1">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-600 mb-2">
              No notifications
            </div>
            <div className="text-sm text-gray-500">
              You&apos;re all caught up! No new notifications at the moment.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className="border-l-4 border-l-blue-500"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={getNotificationColor(notification.type)}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      <Badge
                        className={getPriorityColor(notification.priority)}
                      >
                        {notification.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          {getActionIcon(notification.action)}
                          {notification.action.replace('-', ' ')}
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Statistics</CardTitle>
          <CardDescription>
            Overview of notification types and priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.priority === 'critical').length}
              </div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-500">High</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.priority === 'medium').length}
              </div>
              <div className="text-sm text-gray-500">Medium</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {notifications.filter(n => n.priority === 'low').length}
              </div>
              <div className="text-sm text-gray-500">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
