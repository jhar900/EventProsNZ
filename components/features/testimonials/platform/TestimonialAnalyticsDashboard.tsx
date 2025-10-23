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
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Eye,
  ThumbsUp,
  Download,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalTestimonials: number;
    approvedTestimonials: number;
    pendingTestimonials: number;
    rejectedTestimonials: number;
    averageRating: number;
    totalViews: number;
    engagementScore: number;
  };
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  categoryBreakdown: {
    event_manager: number;
    contractor: number;
  };
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  trends: {
    daily: Array<{
      date: string;
      testimonials: number;
      views: number;
      engagement: number;
    }>;
    weekly: Array<{
      week: string;
      testimonials: number;
      views: number;
      engagement: number;
    }>;
    monthly: Array<{
      month: string;
      testimonials: number;
      views: number;
      engagement: number;
    }>;
  };
  topPerformers: Array<{
    id: string;
    rating: number;
    feedback: string;
    views: number;
    engagement_score: number;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
  conversionMetrics: {
    testimonialToInquiry: number;
    testimonialToSignup: number;
    testimonialToConversion: number;
  };
}

interface TestimonialAnalyticsDashboardProps {
  className?: string;
}

export function TestimonialAnalyticsDashboard({
  className,
}: TestimonialAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/testimonials/platform/analytics?range=${dateRange}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/testimonials/platform/analytics/export?range=${dateRange}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testimonial-analytics-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    overview,
    ratingDistribution,
    categoryBreakdown,
    statusBreakdown,
    trends,
    topPerformers,
    conversionMetrics,
  } = analytics;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Testimonial Analytics</span>
          </h2>
          <p className="text-gray-600">
            Comprehensive testimonial performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {overview.totalTestimonials}
                </div>
                <div className="text-sm text-gray-600">Total Testimonials</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {overview.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {overview.totalViews.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {overview.engagementScore}%
                </div>
                <div className="text-sm text-gray-600">Engagement Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Testimonial approval status breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const percentage = (count / overview.totalTestimonials) * 100;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Star rating breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(ratingDistribution).map(([rating, count]) => {
                const percentage = (count / overview.totalTestimonials) * 100;
                return (
                  <div key={rating} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">
                          {rating} Star{rating !== '1' ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Testimonials by user category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categoryBreakdown).map(([category, count]) => {
              const percentage = (count / overview.totalTestimonials) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Performing Testimonials</CardTitle>
          <CardDescription>
            Testimonials with highest engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {testimonial.user.first_name} {testimonial.user.last_name}
                    </div>
                    <div className="text-sm text-gray-600 truncate max-w-md">
                      &ldquo;{testimonial.feedback}&rdquo;
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{testimonial.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>{testimonial.views}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-4 w-4 text-green-400" />
                    <span>{testimonial.engagement_score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Impact</CardTitle>
          <CardDescription>
            How testimonials affect user conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {conversionMetrics.testimonialToInquiry}%
              </div>
              <div className="text-sm text-gray-600">Testimonial → Inquiry</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {conversionMetrics.testimonialToSignup}%
              </div>
              <div className="text-sm text-gray-600">Testimonial → Signup</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {conversionMetrics.testimonialToConversion}%
              </div>
              <div className="text-sm text-gray-600">
                Testimonial → Conversion
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
