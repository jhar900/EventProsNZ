'use client';

import { useState, useEffect, useCallback } from 'react';

interface VerificationItem {
  id: string;
  user_id: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'resubmitted';
  priority: number;
  verification_type: 'event_manager' | 'contractor';
  submitted_at: string;
  reviewed_at?: string;
  users: {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  business_profiles?: {
    company_name: string;
    nzbn: string;
  };
}

interface VerificationMetrics {
  total_verifications: number;
  approved: number;
  rejected: number;
  resubmitted: number;
  auto_approved: number;
  pending: number;
  in_review: number;
  contractor_submissions: number;
  event_manager_submissions: number;
  approval_rate: number;
  rejection_rate: number;
  period: {
    start: string;
    end: string;
    type: string;
  };
}

interface VerificationTrends {
  daily: Record<
    string,
    {
      approved: number;
      rejected: number;
      resubmitted: number;
      auto_approved: number;
    }
  >;
  summary: {
    total_days: number;
    avg_daily_verifications: number;
  };
}

interface Notification {
  id: string;
  type: 'verification_request' | 'verification_reminder' | 'system_alert';
  title: string;
  message: string;
  is_read: boolean;
  related_user_id?: string;
  related_verification_id?: string;
  created_at: string;
  read_at?: string;
  related_user?: {
    id: string;
    email: string;
    role: string;
  };
  related_verification?: {
    id: string;
    status: string;
    verification_type: string;
  };
}

interface UseVerificationReturn {
  // Verification Queue
  verifications: VerificationItem[];
  loading: boolean;
  error: string | null;
  total: number;

  // Analytics
  metrics: VerificationMetrics | null;
  trends: VerificationTrends | null;
  analyticsLoading: boolean;

  // Notifications
  notifications: Notification[];
  notificationsLoading: boolean;
  unreadCount: number;

  // Actions
  fetchVerifications: (filters?: VerificationFilters) => Promise<void>;
  approveUser: (userId: string, reason?: string) => Promise<boolean>;
  rejectUser: (
    userId: string,
    reason: string,
    feedback?: string
  ) => Promise<boolean>;
  resubmitUser: (userId: string) => Promise<boolean>;
  fetchAnalytics: (period?: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationIds: string[]) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

interface VerificationFilters {
  status?: string;
  priority?: number;
  limit?: number;
  offset?: number;
  search?: string;
}

export function useVerification(): UseVerificationReturn {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null);
  const [trends, setTrends] = useState<VerificationTrends | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchVerifications = useCallback(
    async (filters: VerificationFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority)
          params.append('priority', filters.priority.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`/api/admin/verification/queue?${params}`);
        const data = await response.json();

        if (response.ok) {
          setVerifications(data.verifications);
          setTotal(data.total);
        } else {
          setError(data.error || 'Failed to fetch verifications');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching verifications:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const approveUser = useCallback(
    async (userId: string, reason?: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/admin/verification/${userId}/approve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Update local state
          setVerifications(prev =>
            prev.map(v =>
              v.user_id === userId
                ? {
                    ...v,
                    status: 'approved' as any,
                    reviewed_at: new Date().toISOString(),
                  }
                : v
            )
          );
          return true;
        } else {
          setError(data.error || 'Failed to approve user');
          return false;
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error approving user:', err);
        return false;
      }
    },
    []
  );

  const rejectUser = useCallback(
    async (
      userId: string,
      reason: string,
      feedback?: string
    ): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/admin/verification/${userId}/reject`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, feedback }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Update local state
          setVerifications(prev =>
            prev.map(v =>
              v.user_id === userId
                ? {
                    ...v,
                    status: 'rejected' as any,
                    reviewed_at: new Date().toISOString(),
                  }
                : v
            )
          );
          return true;
        } else {
          setError(data.error || 'Failed to reject user');
          return false;
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error rejecting user:', err);
        return false;
      }
    },
    []
  );

  const resubmitUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/admin/verification/${userId}/resubmit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setVerifications(prev =>
          prev.map(v =>
            v.user_id === userId
              ? {
                  ...v,
                  status: 'resubmitted' as any,
                  reviewed_at: new Date().toISOString(),
                }
              : v
          )
        );
        return true;
      } else {
        setError(data.error || 'Failed to resubmit user');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error resubmitting user:', err);
      return false;
    }
  }, []);

  const fetchAnalytics = useCallback(async (period: string = 'month') => {
    setAnalyticsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/verification/analytics?period=${period}`
      );
      const data = await response.json();

      if (response.ok) {
        setMetrics(data.metrics);
        setTrends(data.trends);
      } else {
        console.error('Error fetching analytics:', data.error);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await fetch('/api/admin/verification/notifications');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
      } else {
        console.error('Error fetching notifications:', data.error);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const markNotificationRead = useCallback(
    async (notificationIds: string[]) => {
      try {
        const response = await fetch('/api/admin/verification/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_ids: notificationIds }),
        });

        if (response.ok) {
          setNotifications(prev =>
            prev.map(notification =>
              notificationIds.includes(notification.id)
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
            )
          );
        }
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

    if (unreadIds.length > 0) {
      await markNotificationRead(unreadIds);
    }
  }, [notifications, markNotificationRead]);

  // Auto-fetch notifications on mount
  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    verifications,
    loading,
    error,
    total,
    metrics,
    trends,
    analyticsLoading,
    notifications,
    notificationsLoading,
    unreadCount,
    fetchVerifications,
    approveUser,
    rejectUser,
    resubmitUser,
    fetchAnalytics,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
