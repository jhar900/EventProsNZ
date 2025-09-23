import { useState, useCallback } from 'react';

interface AdminUser {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  status: 'active' | 'suspended' | 'deleted';
  last_login: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  business_profiles?: {
    company_name: string;
    subscription_tier: string;
  };
}

interface VerificationItem {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
  };
  business_profiles: {
    company_name: string;
    business_address: string;
    nzbn: string;
    description: string;
    service_areas: string[];
    is_verified: boolean;
  };
}

interface PlatformMetrics {
  totalUsers: number;
  newUsers: number;
  totalContractors: number;
  verifiedContractors: number;
  totalEventManagers: number;
  verificationRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  database: {
    status: string;
    responseTime: number;
    error?: string;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalContractors: number;
    pendingVerifications: number;
  };
  alerts: any[];
  recentErrors: any[];
  timestamp: string;
}

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

interface ContentReport {
  id: string;
  content_type: string;
  content_id: string;
  reported_by: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    email: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution?: string;
}

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(
    async <T>(requestFn: () => Promise<Response>): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await requestFn();

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Request failed');
        }

        return await response.json();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Admin request error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // User Management
  const fetchUsers = useCallback(
    async (
      filters: {
        role?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
      } = {}
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      return handleRequest<{
        users: AdminUser[];
        total: number;
        limit: number;
        offset: number;
      }>(() => fetch(`/api/admin/users?${params}`));
    },
    [handleRequest]
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: string) => {
      return handleRequest<{ success: boolean; user: AdminUser }>(() =>
        fetch(`/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );
    },
    [handleRequest]
  );

  const suspendUser = useCallback(
    async (userId: string) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch(`/api/admin/users/${userId}/suspend`, {
          method: 'PUT',
        })
      );
    },
    [handleRequest]
  );

  const activateUser = useCallback(
    async (userId: string) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch(`/api/admin/users/${userId}/activate`, {
          method: 'PUT',
        })
      );
    },
    [handleRequest]
  );

  const verifyUser = useCallback(
    async (userId: string) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch(`/api/admin/users/${userId}/verify`, {
          method: 'PUT',
        })
      );
    },
    [handleRequest]
  );

  // Verification Management
  const fetchVerificationQueue = useCallback(
    async (
      filters: {
        status?: string;
        priority?: string;
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      return handleRequest<{
        verifications: VerificationItem[];
        total: number;
      }>(() => fetch(`/api/admin/verification/queue?${params}`));
    },
    [handleRequest]
  );

  const approveVerification = useCallback(
    async (verificationId: string, reason?: string) => {
      return handleRequest<{
        success: boolean;
        verification: VerificationItem;
      }>(() =>
        fetch(`/api/admin/verification/${verificationId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
      );
    },
    [handleRequest]
  );

  const rejectVerification = useCallback(
    async (verificationId: string, reason: string, feedback?: string) => {
      return handleRequest<{
        success: boolean;
        verification: VerificationItem;
      }>(() =>
        fetch(`/api/admin/verification/${verificationId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, feedback }),
        })
      );
    },
    [handleRequest]
  );

  // Analytics
  const fetchAnalytics = useCallback(
    async (period: string = '7d', dateFrom?: string, dateTo?: string) => {
      const params = new URLSearchParams({ period });
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      return handleRequest<{
        metrics: PlatformMetrics;
        trends: any;
        period: string;
        dateRange: { from: string; to: string };
      }>(() => fetch(`/api/admin/analytics?${params}`));
    },
    [handleRequest]
  );

  // System Health
  const fetchSystemHealth = useCallback(async () => {
    return handleRequest<{ health: SystemHealth }>(() =>
      fetch('/api/admin/system?type=health')
    );
  }, [handleRequest]);

  const fetchSystemPerformance = useCallback(
    async (period: string = '24h') => {
      return handleRequest<{ performance: any }>(() =>
        fetch(`/api/admin/system?type=performance&period=${period}`)
      );
    },
    [handleRequest]
  );

  // User Activity
  const fetchUserActivity = useCallback(
    async (
      filters: {
        userId?: string;
        type?: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
      } = {}
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      return handleRequest<{
        activities: UserActivity[];
        total: number;
        limit: number;
        offset: number;
        summary: any;
        suspiciousActivities: any[];
      }>(() => fetch(`/api/admin/activity?${params}`));
    },
    [handleRequest]
  );

  // Content Moderation
  const fetchContentReports = useCallback(
    async (
      filters: {
        status?: string;
        type?: string;
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      return handleRequest<{
        reports: ContentReport[];
        total: number;
        limit: number;
        offset: number;
        summary: any;
      }>(() => fetch(`/api/admin/content?${params}`));
    },
    [handleRequest]
  );

  const moderateContent = useCallback(
    async (
      action: string,
      reportId: string,
      reason?: string,
      contentId?: string,
      contentType?: string
    ) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            reportId,
            reason,
            contentId,
            contentType,
          }),
        })
      );
    },
    [handleRequest]
  );

  // System Alerts
  const fetchAlerts = useCallback(
    async (
      filters: {
        severity?: string;
        resolved?: boolean;
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      return handleRequest<{
        alerts: SystemAlert[];
        total: number;
        limit: number;
        offset: number;
        summary: any;
      }>(() => fetch(`/api/admin/alerts?${params}`));
    },
    [handleRequest]
  );

  const resolveAlert = useCallback(
    async (alertId: string, resolution?: string) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch('/api/admin/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', alertId, resolution }),
        })
      );
    },
    [handleRequest]
  );

  const dismissAlert = useCallback(
    async (alertId: string) => {
      return handleRequest<{ success: boolean }>(() =>
        fetch('/api/admin/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss', alertId }),
        })
      );
    },
    [handleRequest]
  );

  const createAlert = useCallback(
    async (
      alertType: string,
      severity: string,
      message: string,
      details?: any
    ) => {
      return handleRequest<{ alert: SystemAlert }>(() =>
        fetch('/api/admin/alerts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertType, severity, message, details }),
        })
      );
    },
    [handleRequest]
  );

  // Reports
  const exportReport = useCallback(
    async (
      type: string,
      format: string = 'csv',
      dateFrom?: string,
      dateTo?: string
    ) => {
      const params = new URLSearchParams({ type, format });
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      return handleRequest<Blob>(() => fetch(`/api/admin/reports?${params}`));
    },
    [handleRequest]
  );

  return {
    loading,
    error,

    // User Management
    fetchUsers,
    updateUserStatus,
    suspendUser,
    activateUser,
    verifyUser,

    // Verification Management
    fetchVerificationQueue,
    approveVerification,
    rejectVerification,

    // Analytics
    fetchAnalytics,

    // System Health
    fetchSystemHealth,
    fetchSystemPerformance,

    // User Activity
    fetchUserActivity,

    // Content Moderation
    fetchContentReports,
    moderateContent,

    // System Alerts
    fetchAlerts,
    resolveAlert,
    dismissAlert,
    createAlert,

    // Reports
    exportReport,
  };
}
