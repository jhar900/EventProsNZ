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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Clock,
  MousePointer,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

interface BehaviorMetrics {
  avg_session_duration: number;
  avg_queries_per_session: number;
  avg_clicks_per_session: number;
  bounce_rate: number;
  return_visitor_rate: number;
  date: string;
}

interface UserJourney {
  user_id: string;
  session_count: number;
  total_queries: number;
  total_clicks: number;
  avg_session_duration: number;
  journey_type: string;
}

interface BehaviorAnalyticsProps {
  timePeriod: string;
  className?: string;
}

export default function BehaviorAnalytics({
  timePeriod,
  className,
}: BehaviorAnalyticsProps) {
  const [behaviorMetrics, setBehaviorMetrics] =
    useState<BehaviorMetrics | null>(null);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSegment, setUserSegment] = useState('all');

  const fetchBehaviorAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/behavior?period=${timePeriod}&user_segment=${userSegment}`
      );
      const data = await response.json();

      if (data.behavior_metrics) {
        setBehaviorMetrics(data.behavior_metrics);
      }
      if (data.user_journeys) {
        setUserJourneys(data.user_journeys);
      }
    } catch (error) {
      console.error('Error fetching behavior analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviorAnalytics();
  }, [timePeriod, userSegment]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h`;
    }
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const getJourneyTypeColor = (type: string) => {
    switch (type) {
      case 'high_engagement':
        return 'bg-green-100 text-green-800';
      case 'medium_engagement':
        return 'bg-yellow-100 text-yellow-800';
      case 'low_engagement':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJourneyTypeIcon = (type: string) => {
    switch (type) {
      case 'high_engagement':
        return '🚀';
      case 'medium_engagement':
        return '📊';
      case 'low_engagement':
        return '📉';
      default:
        return '❓';
    }
  };

  const getBounceRateColor = (rate: number) => {
    if (rate < 30) return 'text-green-600';
    if (rate < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReturnVisitorColor = (rate: number) => {
    if (rate > 70) return 'text-green-600';
    if (rate > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Behavior Analytics
            </CardTitle>
            <CardDescription>
              User search behavior patterns and journey analysis
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBehaviorAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={userSegment} onValueChange={setUserSegment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="User segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="new">New Users</SelectItem>
              <SelectItem value="returning">Returning Users</SelectItem>
              <SelectItem value="premium">Premium Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Behavior Metrics Overview */}
            {behaviorMetrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Session Duration
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatDuration(behaviorMetrics.avg_session_duration)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Time spent searching
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Queries/Session
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {behaviorMetrics.avg_queries_per_session.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Search queries per session
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Clicks/Session
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {behaviorMetrics.avg_clicks_per_session.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Result clicks per session
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Bounce Rate</span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getBounceRateColor(behaviorMetrics.bounce_rate)}`}
                  >
                    {formatPercentage(behaviorMetrics.bounce_rate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Single-query sessions
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Return Visitor Rate
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getReturnVisitorColor(behaviorMetrics.return_visitor_rate)}`}
                  >
                    {formatPercentage(behaviorMetrics.return_visitor_rate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Multi-query sessions
                  </p>
                </div>
              </div>
            )}

            {/* User Journey Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium">User Journey Analysis</h4>
              {userJourneys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user journey data found for the selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {userJourneys.slice(0, 15).map((journey, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {getJourneyTypeIcon(journey.journey_type)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              User {journey.user_id.slice(0, 8)}...
                            </span>
                            <Badge
                              variant="outline"
                              className={getJourneyTypeColor(
                                journey.journey_type
                              )}
                            >
                              {journey.journey_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{journey.session_count} sessions</span>
                            <span>
                              {formatNumber(journey.total_queries)} queries
                            </span>
                            <span>
                              {formatNumber(journey.total_clicks)} clicks
                            </span>
                            <span>
                              {formatDuration(journey.avg_session_duration)} avg
                              duration
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {journey.total_queries + journey.total_clicks}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          total actions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Behavior Insights */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Behavior Insights</h4>
              <div className="space-y-2 text-sm">
                {behaviorMetrics && behaviorMetrics.bounce_rate > 50 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">⚠️</span>
                    <span>
                      High bounce rate detected - consider improving search
                      result relevance
                    </span>
                  </div>
                )}
                {behaviorMetrics &&
                  behaviorMetrics.avg_session_duration < 60 && (
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600">⏱️</span>
                      <span>
                        Short session duration - users may not be finding what
                        they need
                      </span>
                    </div>
                  )}
                {behaviorMetrics &&
                  behaviorMetrics.return_visitor_rate > 60 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <span>
                        Good return visitor rate - users are finding value in
                        the platform
                      </span>
                    </div>
                  )}
                {userJourneys.filter(j => j.journey_type === 'high_engagement')
                  .length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">📈</span>
                    <span>
                      {
                        userJourneys.filter(
                          j => j.journey_type === 'high_engagement'
                        ).length
                      }{' '}
                      users show high engagement patterns
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
