'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
  };
  ratings: {
    average: number;
    distribution: { [key: string]: number };
    total: number;
  };
  categories: {
    event_manager: number;
    contractor: number;
  };
  recent: Array<{
    id: string;
    rating: number;
    feedback: string;
    category: string;
    created_at: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
}

interface TestimonialAnalyticsProps {
  className?: string;
}

export function TestimonialAnalytics({ className }: TestimonialAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/testimonials/platform/analytics');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch analytics');
        }

        setAnalytics(data.analytics);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getCategoryLabel = (category: string) => {
    return category === 'event_manager' ? 'Event Manager' : 'Contractor';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold">Testimonial Analytics</h2>
        <p className="text-gray-600">
          Platform testimonial performance and insights
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Testimonials
                </p>
                <p className="text-2xl font-bold">{analytics.overview.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {analytics.overview.approved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {analytics.overview.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Approval Rate
                </p>
                <p className="text-2xl font-bold">
                  {analytics.overview.approvalRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              Average rating: {analytics.ratings.average}/5
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.ratings.distribution).map(
                ([rating, count]) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(parseInt(rating))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{
                              width: `${(count / analytics.ratings.total) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Testimonials by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    Event Managers
                  </Badge>
                </div>
                <span className="text-2xl font-bold">
                  {analytics.categories.event_manager}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    Contractors
                  </Badge>
                </div>
                <span className="text-2xl font-bold">
                  {analytics.categories.contractor}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Testimonials</CardTitle>
          <CardDescription>
            Latest approved testimonials (last 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recent.length > 0 ? (
            <div className="space-y-4">
              {analytics.recent.map(testimonial => (
                <div key={testimonial.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(testimonial.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {testimonial.rating}/5
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(testimonial.category)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {testimonial.feedback}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.user.first_name}{' '}
                        {testimonial.user.last_name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(testimonial.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent testimonials found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
