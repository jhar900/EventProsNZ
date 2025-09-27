'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Activity, TrendingUp, BarChart3, Calendar } from 'lucide-react';

interface EngagementMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  avg_queries_per_user: number;
  avg_clicks_per_user: number;
  engagement_score: number;
  date: string;
}

interface UserActivity {
  user_id: string;
  activity_date: string;
  queries_count: number;
  clicks_count: number;
  sessions_count: number;
  activity_score: number;
}

interface EngagementMetricsProps {
  timePeriod: string;
  className?: string;
}

export default function EngagementMetrics({
  timePeriod,
  className,
}: EngagementMetricsProps) {
  const [engagementMetrics, setEngagementMetrics] =
    useState<EngagementMetrics | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEngagementMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/engagement?period=${timePeriod}`
      );
      const data = await response.json();

      if (data.engagement_metrics) {
        setEngagementMetrics(data.engagement_metrics);
      }
      if (data.user_activity) {
        setUserActivity(data.user_activity);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementMetrics();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEngagementBadgeVariant = (level: string) => {
    switch (level) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getActivityLevel = (score: number) => {
    if (score >= 20) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Engagement Metrics
            </CardTitle>
            <CardDescription>
              User activity levels and engagement patterns
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEngagementMetrics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Engagement Metrics Overview */}
            {engagementMetrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Daily Active Users
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(engagementMetrics.daily_active_users)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users searching today
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Weekly Active Users
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(engagementMetrics.weekly_active_users)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users this week
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Monthly Active Users
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(engagementMetrics.monthly_active_users)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users this month
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Queries/User
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {engagementMetrics.avg_queries_per_user.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Search queries per user
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg Clicks/User</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {engagementMetrics.avg_clicks_per_user.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Result clicks per user
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Engagement Score
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getEngagementColor(getEngagementLevel(engagementMetrics.engagement_score))}`}
                  >
                    {engagementMetrics.engagement_score.toFixed(1)}
                  </div>
                  <Badge
                    variant={getEngagementBadgeVariant(
                      getEngagementLevel(engagementMetrics.engagement_score)
                    )}
                  >
                    {getEngagementLevel(engagementMetrics.engagement_score)}{' '}
                    engagement
                  </Badge>
                </div>
              </div>
            )}

            {/* Engagement Score Progress */}
            {engagementMetrics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Overall Engagement Score
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {engagementMetrics.engagement_score.toFixed(1)} / 10.0
                  </span>
                </div>
                <Progress
                  value={engagementMetrics.engagement_score}
                  max={10}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Based on queries per user and clicks per user metrics
                </p>
              </div>
            )}

            {/* User Activity Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium">Top Active Users</h4>
              {userActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user activity data found for the selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {userActivity.slice(0, 10).map((activity, index) => {
                    const activityLevel = getActivityLevel(
                      activity.activity_score
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                User {activity.user_id.slice(0, 8)}...
                              </span>
                              <Badge
                                variant="outline"
                                className={getActivityColor(activityLevel)}
                              >
                                {activityLevel} activity
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {formatNumber(activity.queries_count)} queries
                              </span>
                              <span>
                                {formatNumber(activity.clicks_count)} clicks
                              </span>
                              <span>
                                {formatNumber(activity.sessions_count)} sessions
                              </span>
                              <span>
                                {new Date(
                                  activity.activity_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {activity.activity_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            activity score
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Engagement Insights */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Engagement Insights</h4>
              <div className="space-y-2 text-sm">
                {engagementMetrics &&
                  engagementMetrics.engagement_score >= 7 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <span>
                        Excellent user engagement - users are actively using the
                        search functionality
                      </span>
                    </div>
                  )}
                {engagementMetrics &&
                  engagementMetrics.avg_queries_per_user > 5 && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600">📊</span>
                      <span>
                        High query volume per user indicates strong search
                        intent
                      </span>
                    </div>
                  )}
                {engagementMetrics &&
                  engagementMetrics.avg_clicks_per_user > 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600">🎯</span>
                      <span>
                        Good click-through behavior - users are finding relevant
                        results
                      </span>
                    </div>
                  )}
                {engagementMetrics &&
                  engagementMetrics.engagement_score < 4 && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-600">⚠️</span>
                      <span>
                        Low engagement detected - consider improving search
                        experience and result relevance
                      </span>
                    </div>
                  )}
                {userActivity.filter(
                  a => getActivityLevel(a.activity_score) === 'high'
                ).length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">🔥</span>
                    <span>
                      {
                        userActivity.filter(
                          a => getActivityLevel(a.activity_score) === 'high'
                        ).length
                      }{' '}
                      power users with high activity levels
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
