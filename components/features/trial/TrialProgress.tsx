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
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Users,
  Upload,
  Search,
} from 'lucide-react';

interface TrialProgressProps {
  userId: string;
}

interface TrialProgressData {
  trial_day: number;
  days_remaining: number;
  conversion_likelihood: number;
  feature_usage: {
    profile_completion: number;
    portfolio_uploads: number;
    search_usage: number;
    contact_usage: number;
  };
  platform_engagement: {
    login_frequency: number;
    feature_usage_score: number;
    time_spent: number;
  };
  milestones: {
    profile_completed: boolean;
    portfolio_uploaded: boolean;
    first_search: boolean;
    first_contact: boolean;
    profile_optimized: boolean;
  };
}

export default function TrialProgress({ userId }: TrialProgressProps) {
  const [progressData, setProgressData] = useState<TrialProgressData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // Fetch trial conversion data
      const conversionResponse = await fetch(
        `/api/trial/conversion?user_id=${userId}`
      );
      const conversionData = await conversionResponse.json();

      // Fetch trial analytics
      const analyticsResponse = await fetch(
        `/api/trial/analytics?user_id=${userId}`
      );
      const analyticsData = await analyticsResponse.json();

      if (conversionData.error) {
        throw new Error(conversionData.error);
      }

      if (analyticsData.error) {
        throw new Error(analyticsData.error);
      }

      // Combine data to create progress overview
      const latestAnalytics = analyticsData.analytics?.[0];
      const conversion = conversionData.conversion;

      if (latestAnalytics) {
        const progressData: TrialProgressData = {
          trial_day: latestAnalytics.trial_day,
          days_remaining: conversion?.trial_end_date
            ? Math.ceil(
                (new Date(conversion.trial_end_date).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 14,
          conversion_likelihood: latestAnalytics.conversion_likelihood,
          feature_usage: latestAnalytics.feature_usage,
          platform_engagement: latestAnalytics.platform_engagement,
          milestones: {
            profile_completed:
              latestAnalytics.feature_usage.profile_completion >= 0.8,
            portfolio_uploaded:
              latestAnalytics.feature_usage.portfolio_uploads > 0,
            first_search: latestAnalytics.feature_usage.search_usage > 0,
            first_contact: latestAnalytics.feature_usage.contact_usage > 0,
            profile_optimized:
              latestAnalytics.feature_usage.profile_completion >= 0.9,
          },
        };

        setProgressData(progressData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trial progress'
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

  if (!progressData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-600 mb-2">
            No progress data available
          </div>
          <div className="text-sm text-gray-500">
            Start using the platform to see your trial progress
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trial Progress Overview
          </CardTitle>
          <CardDescription>
            Track your progress through the trial period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trial Day */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                Day {progressData.trial_day}
              </div>
              <div className="text-sm text-gray-500">Trial Day</div>
            </div>

            {/* Days Remaining */}
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {progressData.days_remaining}
              </div>
              <div className="text-sm text-gray-500">Days Remaining</div>
            </div>

            {/* Conversion Likelihood */}
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${getConversionLikelihoodColor(progressData.conversion_likelihood)}`}
              >
                {Math.round(progressData.conversion_likelihood * 100)}%
              </div>
              <div className="text-sm text-gray-500">Conversion Likelihood</div>
              <div className="text-xs text-gray-400">
                {getConversionLikelihoodLabel(
                  progressData.conversion_likelihood
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Progress</CardTitle>
          <CardDescription>
            How you&apos;re using different platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Profile Completion
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {Math.round(
                    progressData.feature_usage.profile_completion * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={progressData.feature_usage.profile_completion * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Portfolio Uploads</span>
                </div>
                <span className="text-sm text-gray-500">
                  {progressData.feature_usage.portfolio_uploads} items
                </span>
              </div>
              <Progress
                value={Math.min(
                  (progressData.feature_usage.portfolio_uploads / 5) * 100,
                  100
                )}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Search Usage</span>
                </div>
                <span className="text-sm text-gray-500">
                  {Math.round(progressData.feature_usage.search_usage * 100)}%
                </span>
              </div>
              <Progress
                value={progressData.feature_usage.search_usage * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">
                    Platform Engagement
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {Math.round(
                    progressData.platform_engagement.feature_usage_score * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  progressData.platform_engagement.feature_usage_score * 100
                }
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Milestones</CardTitle>
          <CardDescription>Key achievements during your trial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {progressData.milestones.profile_completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">Profile Completed</div>
                  <div className="text-sm text-gray-500">
                    Complete your profile setup
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {progressData.milestones.portfolio_uploaded ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">Portfolio Uploaded</div>
                  <div className="text-sm text-gray-500">
                    Upload your first portfolio item
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {progressData.milestones.first_search ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">First Search</div>
                  <div className="text-sm text-gray-500">
                    Use the search functionality
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {progressData.milestones.first_contact ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">First Contact</div>
                  <div className="text-sm text-gray-500">
                    Make your first contact
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {progressData.milestones.profile_optimized ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">Profile Optimized</div>
                  <div className="text-sm text-gray-500">
                    Optimize your profile for maximum visibility
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Your activity and engagement levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progressData.platform_engagement.login_frequency}
              </div>
              <div className="text-sm text-gray-500">Login Frequency</div>
              <div className="text-xs text-gray-400">per week</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(progressData.platform_engagement.time_spent)} min
              </div>
              <div className="text-sm text-gray-500">Time Spent</div>
              <div className="text-xs text-gray-400">total</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  progressData.platform_engagement.feature_usage_score * 100
                )}
                %
              </div>
              <div className="text-sm text-gray-500">Feature Usage</div>
              <div className="text-xs text-gray-400">score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Summary</CardTitle>
          <CardDescription>
            Overall trial progress and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trial Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round(((14 - progressData.days_remaining) / 14) * 100)}%
                complete
              </span>
            </div>
            <Progress
              value={((14 - progressData.days_remaining) / 14) * 100}
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Likelihood</span>
              <span className="text-sm text-gray-500">
                {getConversionLikelihoodLabel(
                  progressData.conversion_likelihood
                )}
              </span>
            </div>
            <Progress
              value={progressData.conversion_likelihood * 100}
              className="h-2"
            />

            {progressData.days_remaining <= 3 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="font-medium text-orange-800">
                    Trial ending soon!
                  </div>
                  <div className="text-orange-700 mt-1">
                    Your trial ends in {progressData.days_remaining} days.
                    Consider upgrading to continue using the platform.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
