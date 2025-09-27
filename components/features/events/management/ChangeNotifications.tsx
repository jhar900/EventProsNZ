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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ChangeNotificationsProps {
  eventId: string;
}

interface Notification {
  id: string;
  contractor_id: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export function ChangeNotifications({ eventId }: ChangeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    recipient_id: '',
    notification_type: '',
    message: '',
  });

  useEffect(() => {
    loadNotifications();
  }, [eventId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/notifications`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    if (
      !newNotification.recipient_id ||
      !newNotification.notification_type ||
      !newNotification.message
    )
      return;

    try {
      setIsCreating(true);
      const response = await fetch(`/api/events/${eventId}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification),
      });

      const data = await response.json();

      if (data.success) {
        setNewNotification({
          recipient_id: '',
          notification_type: '',
          message: '',
        });
        setShowCreateForm(false);
        await loadNotifications();
      } else {
        }
    } catch (error) {
      } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch(`/api/events/${eventId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      const data = await response.json();

      if (data.success) {
        await loadNotifications();
      }
    } catch (error) {
      }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_created':
      case 'event_updated':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'event_cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'event_confirmed':
      case 'event_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="space-y-6">
      {/* Create Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Send Notification
          </CardTitle>
          <CardDescription>
            Send a notification to contractors about event changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              Send Notification
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_id">Recipient</Label>
                  <Select
                    value={newNotification.recipient_id}
                    onValueChange={value =>
                      setNewNotification(prev => ({
                        ...prev,
                        recipient_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This would be populated with actual contractors */}
                      <SelectItem value="contractor1">John Doe</SelectItem>
                      <SelectItem value="contractor2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification_type">Notification Type</Label>
                  <Select
                    value={newNotification.notification_type}
                    onValueChange={value =>
                      setNewNotification(prev => ({
                        ...prev,
                        notification_type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_updated">
                        Event Updated
                      </SelectItem>
                      <SelectItem value="event_cancelled">
                        Event Cancelled
                      </SelectItem>
                      <SelectItem value="service_requirement_added">
                        Service Requirement Added
                      </SelectItem>
                      <SelectItem value="milestone_created">
                        Milestone Created
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter notification message..."
                  value={newNotification.message}
                  onChange={e =>
                    setNewNotification(prev => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCreateNotification}
                  disabled={
                    !newNotification.recipient_id ||
                    !newNotification.notification_type ||
                    !newNotification.message ||
                    isCreating
                  }
                >
                  {isCreating ? 'Sending...' : 'Send Notification'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewNotification({
                      recipient_id: '',
                      notification_type: '',
                      message: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Unread Notifications ({unreadNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unreadNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg bg-red-50"
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">Unread</Badge>
                        <Badge variant="outline">
                          {getNotificationTypeLabel(
                            notification.notification_type
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      {notification.profiles
                        ? `${notification.profiles.first_name} ${notification.profiles.last_name}`
                        : 'Unknown User'}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{notification.message}</p>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead([notification.id])}
                      >
                        Mark as Read
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            All Notifications
          </CardTitle>
          <CardDescription>
            Complete notification history for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications sent yet
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {notification.is_read ? (
                          <Badge variant="secondary">Read</Badge>
                        ) : (
                          <Badge variant="destructive">Unread</Badge>
                        )}
                        <Badge variant="outline">
                          {getNotificationTypeLabel(
                            notification.notification_type
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      {notification.profiles
                        ? `${notification.profiles.first_name} ${notification.profiles.last_name}`
                        : 'Unknown User'}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{notification.message}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead([notification.id])}
                        >
                          Mark as Read
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
