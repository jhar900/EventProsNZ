'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartBarIcon,
  EyeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { JobApplicationWithDetails } from '@/types/jobs';

interface ApplicationAnalyticsProps {
  contractorId: string;
  className?: string;
}

interface AnalyticsData {
  total_applications: number;
  applications_by_status: {
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  applications_by_month: Array<{
    month: string;
    count: number;
  }>;
  success_rate: number;
  average_response_time: number;
  top_job_categories: Array<{
    category: string;
    count: number;
  }>;
  recent_applications: JobApplicationWithDetails[];
}

export function ApplicationAnalytics({
  contractorId,
  className = '',
}: ApplicationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [contractorId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/contractors/${contractorId}/analytics?time_range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load analytics'
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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
    if (current < previous)
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading analytics</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Application Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Track your application performance and success rates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={value => setTimeRange(value as '30d' | '90d' | '1y')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applications */}
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.total_applications}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${getSuccessRateColor(analytics.success_rate)}`}
              >
                {analytics.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </Card>

        {/* Average Response Time */}
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.average_response_time.toFixed(1)}d
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </Card>

        {/* Recent Applications */}
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.recent_applications.length}
              </div>
              <div className="text-sm text-gray-600">Recent Applications</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Applications by Status */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Applications by Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.applications_by_status).map(
              ([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {count}
                  </div>
                  <Badge className={getStatusColor(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              )
            )}
          </div>
        </div>
      </Card>

      {/* Monthly Trends */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Trends
          </h3>
          <div className="space-y-2">
            {analytics.applications_by_month.map((month, index) => {
              const previousMonth =
                index > 0 ? analytics.applications_by_month[index - 1] : null;
              const trend = previousMonth
                ? month.count - previousMonth.count
                : 0;

              return (
                <div
                  key={month.month}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {month.month}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {month.count} applications
                    </span>
                    {previousMonth &&
                      getTrendIcon(month.count, previousMonth.count)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Top Job Categories */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Job Categories
          </h3>
          <div className="space-y-2">
            {analytics.top_job_categories.map((category, index) => (
              <div
                key={category.category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    #{index + 1}{' '}
                    {category.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {category.count} applications
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(category.count / analytics.total_applications) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Applications */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Applications
          </h3>
          <div className="space-y-3">
            {analytics.recent_applications.slice(0, 5).map(application => (
              <div
                key={application.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {application.job?.title || 'Unknown Job'}
                  </div>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() +
                      application.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
