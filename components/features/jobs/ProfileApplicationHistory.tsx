'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface ProfileApplicationHistoryProps {
  contractorId: string;
  showFullHistory?: boolean;
  className?: string;
}

interface ApplicationStats {
  total_applications: number;
  success_rate: number;
  applications_by_status: {
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  recent_applications: JobApplicationWithDetails[];
  monthly_trend: number;
}

export function ProfileApplicationHistory({
  contractorId,
  showFullHistory = false,
  className = '',
}: ProfileApplicationHistoryProps) {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [contractorId]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/contractors/${contractorId}/applications/stats`
      );

      if (!response.ok) {
        throw new Error('Failed to load application stats');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to load application stats');
      }
    } catch (error) {
      console.error('Error loading application stats:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load application stats'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return ClockIcon;
      case 'reviewed':
        return EyeIcon;
      case 'accepted':
        return CheckCircleIcon;
      case 'rejected':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0)
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
    if (trend < 0)
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Loading application history...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            Error loading application history
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadStats} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Application History
          </h3>
          <p className="text-sm text-gray-600">
            Track your job application performance
          </p>
        </div>
        {showFullHistory && (
          <Button variant="outline" size="sm">
            View Full History
          </Button>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Applications */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {stats.total_applications}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div
                className={`text-xl font-bold ${getSuccessRateColor(stats.success_rate)}`}
              >
                {stats.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              {getTrendIcon(stats.monthly_trend)}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {Math.abs(stats.monthly_trend)}%
              </div>
              <div className="text-sm text-gray-600">Monthly Trend</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Applications by Status */}
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">
            Applications by Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.applications_by_status).map(
              ([status, count]) => {
                const Icon = getStatusIcon(status);
                const percentage =
                  stats.total_applications > 0
                    ? (count / stats.total_applications) * 100
                    : 0;

                return (
                  <div key={status} className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {count}
                      </span>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    <div className="mt-2">
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </Card>

      {/* Recent Applications */}
      {stats.recent_applications.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">
              Recent Applications
            </h4>
            <div className="space-y-3">
              {stats.recent_applications
                .slice(0, showFullHistory ? 10 : 5)
                .map(application => {
                  const StatusIcon = getStatusIcon(application.status);

                  return (
                    <div
                      key={application.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {application.job?.title || 'Unknown Job'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.job?.service_category
                              ?.replace('_', ' ')
                              .toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(
                            new Date(application.created_at),
                            { addSuffix: true }
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {!showFullHistory && stats.recent_applications.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All {stats.recent_applications.length} Applications
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {stats.total_applications === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Applications Yet
            </h4>
            <p className="text-gray-600 mb-4">
              Start applying to jobs to see your application history here.
            </p>
            <Button>Browse Jobs</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
