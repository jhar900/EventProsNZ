import { useState, useEffect } from 'react';
import {
  Event,
  EventUpdate,
  EventVersion,
  EventNotification,
} from '@/types/events';

interface UseEventManagementOptions {
  eventId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseEventManagementReturn {
  event: Event | null;
  versions: EventVersion[];
  notifications: EventNotification[];
  isLoading: boolean;
  error: string | null;
  updateEvent: (updates: EventUpdate) => Promise<boolean>;
  deleteEvent: () => Promise<boolean>;
  loadVersions: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshEvent: () => Promise<void>;
}

export function useEventManagement({
  eventId,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseEventManagementOptions = {}): UseEventManagementReturn {
  const [event, setEvent] = useState<Event | null>(null);
  const [versions, setVersions] = useState<EventVersion[]>([]);
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load event data
  const loadEvent = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.event);
      } else {
        setError(data.message || 'Failed to load event');
      }
    } catch (err) {
      setError('Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load event versions
  const loadVersions = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/events/${eventId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.versions);
      } else {
        console.error('Failed to load versions:', data.message);
      }
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  };

  // Load event notifications
  const loadNotifications = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/events/${eventId}/notifications`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      } else {
        console.error('Failed to load notifications:', data.message);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  // Update event
  const updateEvent = async (updates: EventUpdate): Promise<boolean> => {
    if (!eventId) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setEvent(data.event);
        return true;
      } else {
        setError(data.message || 'Failed to update event');
        return false;
      }
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete event
  const deleteEvent = async (): Promise<boolean> => {
    if (!eventId) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setEvent(null);
        return true;
      } else {
        setError(data.message || 'Failed to delete event');
        return false;
      }
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (
    notificationId: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/events/${eventId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
          isRead: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Refresh event data
  const refreshEvent = async () => {
    await Promise.all([loadEvent(), loadVersions(), loadNotifications()]);
  };

  // Load initial data
  useEffect(() => {
    if (eventId) {
      refreshEvent();
    }
  }, [eventId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !eventId) return;

    const interval = setInterval(refreshEvent, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, eventId, refreshInterval]);

  return {
    event,
    versions,
    notifications,
    isLoading,
    error,
    updateEvent,
    deleteEvent,
    loadVersions,
    loadNotifications,
    markNotificationAsRead,
    refreshEvent,
  };
}
