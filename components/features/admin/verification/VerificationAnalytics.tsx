'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface VerificationMetrics {
  total_users: number;
  verified_users: number;
  pending_users: number;
  verification_rate: number;
  contractors: number;
  event_managers: number;
  period: {
    from: string;
    to: string;
  };
}

interface VerificationTrend {
  date: string;
  approvals: number;
  rejections: number;
}

interface VerificationAnalyticsProps {
  period?: string;
}

export function VerificationAnalytics({
  period = '30d',
}: VerificationAnalyticsProps) {
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null);
  const [trends, setTrends] = useState<VerificationTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/verification/analytics?period=${period}`,
        {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'x-admin-token': 'admin-secure-token-2024-eventpros',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setTrends(data.trends);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      setError('Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPeriod = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return `${fromDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })} - ${toDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}`;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="text-orange-600 hover:text-orange-700"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{metrics.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Verified Users
                </p>
                <p className="text-2xl font-bold">{metrics.verified_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Users
                </p>
                <p className="text-2xl font-bold">{metrics.pending_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Verification Rate
                </p>
                <p className="text-2xl font-bold">
                  {metrics.verification_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>User Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Contractors</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Contractors
                  </span>
                  <Badge variant="outline">{metrics.contractors}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${metrics.total_users > 0 ? (metrics.contractors / metrics.total_users) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Event Managers</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Event Managers
                  </span>
                  <Badge variant="outline">{metrics.event_managers}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${metrics.total_users > 0 ? (metrics.event_managers / metrics.total_users) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Trends */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Trends</CardTitle>
            <p className="text-sm text-gray-600">
              {formatPeriod(metrics.period.from, metrics.period.to)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.slice(-7).map((trend, index) => (
                <div
                  key={trend.date}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {formatDate(trend.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {trend.approvals} approvals
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-gray-600">
                        {trend.rejections} rejections
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {metrics.verified_users}
              </div>
              <p className="text-sm text-gray-600">Users Verified</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {metrics.pending_users}
              </div>
              <p className="text-sm text-gray-600">Awaiting Review</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {metrics.verification_rate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Verification Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
