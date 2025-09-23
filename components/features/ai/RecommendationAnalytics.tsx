'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  Brain,
  TestTube,
  Star,
  Clock,
  DollarSign,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface AnalyticsData {
  recommendation_analytics: {
    total_requests: number;
    total_feedback: number;
    feedback_rate: number;
    average_rating: number;
    event_type_breakdown: Record<string, number>;
    feedback_breakdown: Record<string, number>;
    top_event_types: Array<{ event_type: string; count: number }>;
  };
  engagement_analytics: {
    total_interactions: number;
    click_through_rate: number;
    conversion_rate: number;
    action_breakdown: Record<string, number>;
    average_session_duration: number;
    bounce_rate: number;
  };
  learning_analytics: {
    total_learning_events: number;
    average_success_rate: number;
    total_patterns: number;
    high_confidence_patterns: number;
    pattern_confidence_rate: number;
    learning_velocity: number;
  };
  ab_testing_analytics: {
    total_tests: number;
    variant_a_participants: number;
    variant_b_participants: number;
    variant_a_success_rate: number;
    variant_b_success_rate: number;
    winning_variant: string;
    statistical_significance: boolean;
  };
  performance_analytics: {
    total_api_requests: number;
    average_response_time: number;
    error_rate: number;
    uptime_percentage: number;
    cache_hit_rate: number;
    throughput: number;
  };
  metadata: {
    time_period: string;
    start_date: string;
    end_date: string;
    event_type?: string;
    user_id?: string;
    generated_at: string;
  };
}

interface RecommendationAnalyticsProps {
  eventType?: string;
  onClose: () => void;
  className?: string;
}

export function RecommendationAnalytics({
  eventType,
  onClose,
  className = '',
}: RecommendationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [eventType, timePeriod]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        time_period: timePeriod,
      });

      if (eventType) {
        params.append('event_type', eventType);
      }

      const response = await fetch(`/api/ai/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricColor = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricIcon = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value >= thresholds.good)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value >= thresholds.warning)
      return <Activity className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      >
        <Card className="w-full max-w-6xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Loading analytics...</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 w-full bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      >
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analytics Error</CardTitle>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Failed to load analytics data'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <Card className="w-full max-w-7xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                AI Recommendation Analytics
              </CardTitle>
              <CardDescription>
                Performance insights for{' '}
                {eventType ? `${eventType} events` : 'all events'} over the last{' '}
                {timePeriod}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timePeriod}
                onChange={e => setTimePeriod(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.recommendation_analytics.total_requests}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Requests
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        analytics.recommendation_analytics.feedback_rate
                      )}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Feedback Rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.recommendation_analytics.average_rating.toFixed(
                        1
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Rating
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.learning_analytics.total_patterns}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      AI Patterns
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Event Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.recommendation_analytics.top_event_types.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{item.event_type}</span>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <div className="flex items-center gap-2">
                          {getMetricIcon(
                            analytics.performance_analytics.uptime_percentage,
                            { good: 99, warning: 95 }
                          )}
                          <span
                            className={`text-sm font-medium ${getMetricColor(analytics.performance_analytics.uptime_percentage, { good: 99, warning: 95 })}`}
                          >
                            {analytics.performance_analytics.uptime_percentage.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Response Time</span>
                        <div className="flex items-center gap-2">
                          {getMetricIcon(
                            analytics.performance_analytics
                              .average_response_time,
                            { good: 200, warning: 500 }
                          )}
                          <span
                            className={`text-sm font-medium ${getMetricColor(analytics.performance_analytics.average_response_time, { good: 200, warning: 500 })}`}
                          >
                            {analytics.performance_analytics.average_response_time.toFixed(
                              0
                            )}
                            ms
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Error Rate</span>
                        <div className="flex items-center gap-2">
                          {getMetricIcon(
                            100 - analytics.performance_analytics.error_rate,
                            { good: 99, warning: 95 }
                          )}
                          <span
                            className={`text-sm font-medium ${getMetricColor(100 - analytics.performance_analytics.error_rate, { good: 99, warning: 95 })}`}
                          >
                            {analytics.performance_analytics.error_rate.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Requests</span>
                        <span className="font-medium">
                          {analytics.recommendation_analytics.total_requests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Feedback Received</span>
                        <span className="font-medium">
                          {analytics.recommendation_analytics.total_feedback}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Feedback Rate</span>
                        <span className="font-medium">
                          {Math.round(
                            analytics.recommendation_analytics.feedback_rate
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {analytics.recommendation_analytics.average_rating.toFixed(
                              1
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Event Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        analytics.recommendation_analytics.event_type_breakdown
                      ).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Interaction Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Interactions</span>
                        <span className="font-medium">
                          {analytics.engagement_analytics.total_interactions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Click Through Rate</span>
                        <span className="font-medium">
                          {analytics.engagement_analytics.click_through_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Conversion Rate</span>
                        <span className="font-medium">
                          {analytics.engagement_analytics.conversion_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Behavior</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg Session Duration</span>
                        <span className="font-medium">
                          {analytics.engagement_analytics.average_session_duration.toFixed(
                            0
                          )}
                          s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bounce Rate</span>
                        <span className="font-medium">
                          {analytics.engagement_analytics.bounce_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Action Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        analytics.engagement_analytics.action_breakdown
                      ).map(([action, count]) => (
                        <div
                          key={action}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">{action}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Learning Events</span>
                        <span className="font-medium">
                          {analytics.learning_analytics.total_learning_events}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-medium">
                          {Math.round(
                            analytics.learning_analytics.average_success_rate *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Learning Velocity</span>
                        <span className="font-medium">
                          {analytics.learning_analytics.learning_velocity.toFixed(
                            1
                          )}
                          /day
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Pattern Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Patterns</span>
                        <span className="font-medium">
                          {analytics.learning_analytics.total_patterns}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">High Confidence</span>
                        <span className="font-medium">
                          {
                            analytics.learning_analytics
                              .high_confidence_patterns
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confidence Rate</span>
                        <span className="font-medium">
                          {Math.round(
                            analytics.learning_analytics.pattern_confidence_rate
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pattern Quality</span>
                        <div className="flex items-center gap-1">
                          {getMetricIcon(
                            analytics.learning_analytics
                              .pattern_confidence_rate,
                            { good: 80, warning: 60 }
                          )}
                          <span className="font-medium">
                            {Math.round(
                              analytics.learning_analytics
                                .pattern_confidence_rate
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Learning Efficiency</span>
                        <div className="flex items-center gap-1">
                          {getMetricIcon(
                            analytics.learning_analytics.learning_velocity,
                            { good: 5, warning: 2 }
                          )}
                          <span className="font-medium">
                            {analytics.learning_analytics.learning_velocity.toFixed(
                              1
                            )}
                            /day
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">API Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Requests</span>
                        <span className="font-medium">
                          {analytics.performance_analytics.total_api_requests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <div className="flex items-center gap-1">
                          {getMetricIcon(
                            analytics.performance_analytics
                              .average_response_time,
                            { good: 200, warning: 500 }
                          )}
                          <span className="font-medium">
                            {analytics.performance_analytics.average_response_time.toFixed(
                              0
                            )}
                            ms
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Throughput</span>
                        <span className="font-medium">
                          {analytics.performance_analytics.throughput.toFixed(
                            1
                          )}
                          /day
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <div className="flex items-center gap-1">
                          {getMetricIcon(
                            analytics.performance_analytics.uptime_percentage,
                            { good: 99, warning: 95 }
                          )}
                          <span className="font-medium">
                            {analytics.performance_analytics.uptime_percentage.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Error Rate</span>
                        <div className="flex items-center gap-1">
                          {getMetricIcon(
                            100 - analytics.performance_analytics.error_rate,
                            { good: 99, warning: 95 }
                          )}
                          <span className="font-medium">
                            {analytics.performance_analytics.error_rate.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cache Hit Rate</span>
                        <span className="font-medium">
                          {analytics.performance_analytics.cache_hit_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">A/B Testing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Tests</span>
                        <span className="font-medium">
                          {analytics.ab_testing_analytics.total_tests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Variant A Success</span>
                        <span className="font-medium">
                          {analytics.ab_testing_analytics.variant_a_success_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Variant B Success</span>
                        <span className="font-medium">
                          {analytics.ab_testing_analytics.variant_b_success_rate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Statistical Significance
                        </span>
                        <Badge
                          variant={
                            analytics.ab_testing_analytics
                              .statistical_significance
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {analytics.ab_testing_analytics
                            .statistical_significance
                            ? 'Yes'
                            : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
