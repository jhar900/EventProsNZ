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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Mail,
  BarChart3,
  Lightbulb,
  HelpCircle,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface TrialConversionProps {
  userId: string;
}

interface TrialStatus {
  conversion_status: string;
  days_remaining: number;
  tier: string;
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

export default function TrialConversion({ userId }: TrialConversionProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [notifications, setNotifications] = useState<TrialNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialData();
  }, [userId]);

  const fetchTrialData = async () => {
    try {
      setLoading(true);

      // Fetch trial conversion data
      const conversionResponse = await fetch(
        `/api/trial/conversion?user_id=${userId}`
      );
      const conversionData = await conversionResponse.json();

      // Fetch trial notifications
      const notificationsResponse = await fetch(
        `/api/trial/notifications?user_id=${userId}`
      );
      const notificationsData = await notificationsResponse.json();

      if (conversionData.error) {
        throw new Error(conversionData.error);
      }

      if (notificationsData.error) {
        throw new Error(notificationsData.error);
      }

      setTrialStatus(notificationsData.trial_status);
      setNotifications(notificationsData.notifications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trial data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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
      {/* Trial Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trial Status
          </CardTitle>
          <CardDescription>
            Your current trial status and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialStatus && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  className={getStatusColor(trialStatus.conversion_status)}
                >
                  {trialStatus.conversion_status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Days Remaining</span>
                <span className="text-lg font-semibold">
                  {trialStatus.days_remaining}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tier</span>
                <Badge variant="outline">{trialStatus.tier}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Trial Progress</span>
                  <span>
                    {Math.max(0, 14 - trialStatus.days_remaining)}/14 days
                  </span>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    ((14 - trialStatus.days_remaining) / 14) * 100
                  )}
                  className="h-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Important updates about your trial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map(notification => (
                <Alert
                  key={notification.id}
                  className={getPriorityColor(notification.priority)}
                >
                  <div className="flex items-start gap-2">
                    {getPriorityIcon(notification.priority)}
                    <div className="flex-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm mt-1">{notification.message}</div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common actions for your trial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Mail className="h-5 w-5" />
              <span>View Emails</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Lightbulb className="h-5 w-5" />
              <span>Recommendations</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Get Support</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>Upgrade</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Clock className="h-5 w-5" />
              <span>Notifications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
