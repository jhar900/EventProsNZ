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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Mail,
  Search,
  Upload,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface TrialAnalyticsProps {
  userId: string;
}

interface TrialAnalyticsData {
  id: string;
  trial_day: number;
  feature_usage: {
    profile_completion: number;
    portfolio_uploads: number;
    search_usage: number;
    contact_usage: number;
  };
  platform_engagement: {
    login_frequency: number;
    feature_usage_score: number;
    search_usage: number;
    portfolio_uploads: number;
    time_spent: number;
  };
  conversion_likelihood: number;
  created_at: string;
}

interface TrialInsight {
  id: string;
  insight_type: string;
  insight_data: any;
  confidence_score: number;
  created_at: string;
}

export default function TrialAnalytics({ userId }: TrialAnalyticsProps) {
  const [analytics, setAnalytics] = useState<TrialAnalyticsData[]>([]);
  const [insights, setInsights] = useState<TrialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trial/analytics?user_id=${userId}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalytics(data.analytics || []);
      setInsights(data.insights || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trial analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  const getConversionLikelihoodColor = (likelihood: number) => {
    if (likelihood >= 0.8) return 'text-green-600';
    if (likelihood >= 0.6) return 'text-yellow-600';
    if (likelihood >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConversionLikelihoodLabel = (likelihood: number) => {
    if (likelihood >= 0.8) return 'Very High';
    if (likelihood >= 0.6) return 'High';
    if (likelihood >= 0.4) return 'Medium';
    if (likelihood >= 0.2) return 'Low';
    return 'Very Low';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'profile_optimization':
        return <Users className="h-4 w-4" />;
      case 'feature_usage':
        return <BarChart3 className="h-4 w-4" />;
      case 'search_optimization':
        return <Search className="h-4 w-4" />;
      case 'portfolio_optimization':
        return <Upload className="h-4 w-4" />;
      case 'conversion_opportunity':
        return <Target className="h-4 w-4" />;
      case 'engagement_improvement':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'profile_optimization':
        return 'text-blue-600';
      case 'feature_usage':
        return 'text-green-600';
      case 'search_optimization':
        return 'text-purple-600';
      case 'portfolio_optimization':
        return 'text-orange-600';
      case 'conversion_opportunity':
        return 'text-green-600';
      case 'engagement_improvement':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const latestAnalytics = analytics[0];
  const totalAnalytics = analytics.length;

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trial Analytics Overview
          </CardTitle>
          <CardDescription>
            Key metrics and insights from your trial period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Conversion Likelihood */}
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getConversionLikelihoodColor(latestAnalytics.conversion_likelihood)}`}
                >
                  {Math.round(latestAnalytics.conversion_likelihood * 100)}%
                </div>
                <div className="text-sm text-gray-500">
                  Conversion Likelihood
                </div>
                <div className="text-xs text-gray-400">
                  {getConversionLikelihoodLabel(
                    latestAnalytics.conversion_likelihood
                  )}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    latestAnalytics.feature_usage.profile_completion * 100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-500">Profile Completion</div>
                <Progress
                  value={latestAnalytics.feature_usage.profile_completion * 100}
                  className="h-2 mt-2"
                />
              </div>

              {/* Feature Usage Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(
                    latestAnalytics.platform_engagement.feature_usage_score *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-500">Feature Usage</div>
                <Progress
                  value={
                    latestAnalytics.platform_engagement.feature_usage_score *
                    100
                  }
                  className="h-2 mt-2"
                />
              </div>

              {/* Login Frequency */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {latestAnalytics.platform_engagement.login_frequency}
                </div>
                <div className="text-sm text-gray-500">Login Frequency</div>
                <div className="text-xs text-gray-400">per week</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No analytics data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Usage Breakdown */}
      {latestAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Breakdown</CardTitle>
            <CardDescription>
              How you&apos;re using different platform features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Portfolio Uploads</span>
                  <span className="text-sm text-gray-500">
                    {latestAnalytics.feature_usage.portfolio_uploads} items
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (latestAnalytics.feature_usage.portfolio_uploads / 5) * 100,
                    100
                  )}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Search Usage</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(
                      latestAnalytics.feature_usage.search_usage * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={latestAnalytics.feature_usage.search_usage * 100}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact Usage</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(
                      latestAnalytics.feature_usage.contact_usage * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={latestAnalytics.feature_usage.contact_usage * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Spent</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(latestAnalytics.platform_engagement.time_spent)}{' '}
                    minutes
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (latestAnalytics.platform_engagement.time_spent / 120) *
                      100,
                    100
                  )}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Platform Engagement
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(
                      latestAnalytics.platform_engagement.feature_usage_score *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    latestAnalytics.platform_engagement.feature_usage_score *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Insights</CardTitle>
            <CardDescription>
              AI-generated insights based on your trial usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map(insight => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`${getInsightColor(insight.insight_type)} mt-1`}
                    >
                      {getInsightIcon(insight.insight_type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium capitalize">
                        {insight.insight_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {insight.insight_data.message}
                      </div>
                      {insight.insight_data.actions && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            Recommended Actions:
                          </div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {insight.insight_data.actions.map(
                              (action: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-1"
                                >
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {action}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Confidence:{' '}
                          {Math.round(insight.confidence_score * 100)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_data.priority || 'medium'} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics History */}
      {analytics.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics History</CardTitle>
            <CardDescription>Track your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.slice(0, 5).map((analytic, index) => (
                <div
                  key={analytic.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      Day {analytic.trial_day}
                    </div>
                    <Badge
                      className={getConversionLikelihoodColor(
                        analytic.conversion_likelihood
                      )}
                    >
                      {Math.round(analytic.conversion_likelihood * 100)}%
                      conversion
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(analytic.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
