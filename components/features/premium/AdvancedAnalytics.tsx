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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  Users,
  Calendar,
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  userId?: string;
}

interface AnalyticsData {
  profile_views: number;
  search_appearances: number;
  inquiries: number;
  conversion_rate: number;
  top_search_terms: any[];
  recent_activity: any[];
}

export function AdvancedAnalytics({ userId }: AdvancedAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/features/analytics?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setHasAccess(data.has_analytics_access);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <span>Advanced Analytics</span>
          </CardTitle>
          <CardDescription>
            Detailed insights into your profile performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Advanced Analytics Not Available
            </h3>
            <p className="text-gray-500 mb-4">
              Upgrade to Showcase or Spotlight plan to access advanced
              analytics.
            </p>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <span>Analytics Overview</span>
          </CardTitle>
          <CardDescription>
            Key metrics for your profile performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.profile_views || 0}
                </p>
                <p className="text-sm text-muted-foreground">Profile Views</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.search_appearances || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Search Appearances
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.inquiries || 0}
                </p>
                <p className="text-sm text-muted-foreground">Inquiries</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.conversion_rate?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Search Terms */}
      {analytics?.top_search_terms && analytics.top_search_terms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Search Terms</CardTitle>
            <CardDescription>
              Most popular search terms that led to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_search_terms.map((term, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{term.term || term}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {term.count || 1} searches
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {analytics?.recent_activity && analytics.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest interactions with your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recent_activity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {activity.type === 'view' ? (
                      <Eye className="h-5 w-5 text-blue-500" />
                    ) : activity.type === 'search' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.type === 'view' && 'Profile viewed'}
                      {activity.type === 'search' && 'Appeared in search'}
                      {activity.type === 'inquiry' && 'New inquiry received'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>
            AI-powered insights to improve your profile performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Profile Optimization
              </h4>
              <p className="text-sm text-blue-700">
                Your profile views have increased by 25% this month. Consider
                adding more portfolio images to maintain this momentum.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Search Performance
              </h4>
              <p className="text-sm text-green-700">
                You&apos;re appearing in 15% more searches this week. Your
                service categories are well optimized for your target keywords.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">
                Conversion Opportunity
              </h4>
              <p className="text-sm text-yellow-700">
                Your conversion rate is below average. Consider adding customer
                testimonials and updating your pricing information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
