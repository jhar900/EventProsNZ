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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Target,
  Users,
  BarChart3,
  Search,
  Upload,
  CreditCard,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface TrialRecommendationsProps {
  userId: string;
}

interface TrialRecommendation {
  id: string;
  recommendation_type: string;
  recommendation_data: {
    message: string;
    actions?: string[];
    priority?: string;
    tier_suggestion?: string;
    benefits?: string[];
    completion_score?: number;
    usage_score?: number;
    search_score?: number;
    portfolio_count?: number;
    conversion_score?: number;
    engagement_score?: number;
    impact?: string;
    potential_value?: string;
    opportunity?: string;
    conversion_impact?: string;
    roi_estimate?: string;
    support_type?: string;
    days_remaining?: number;
    urgency?: string;
  };
  confidence_score: number;
  is_applied: boolean;
  created_at: string;
}

export default function TrialRecommendations({
  userId,
}: TrialRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TrialRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/trial/recommendations?user_id=${userId}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch trial recommendations'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/trial/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          trial_data: {
            // Include any additional trial data for recommendation generation
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh recommendations
      await fetchRecommendations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate recommendations'
      );
    } finally {
      setGenerating(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'profile_optimization':
        return <Users className="h-5 w-5" />;
      case 'feature_usage':
        return <BarChart3 className="h-5 w-5" />;
      case 'search_optimization':
        return <Search className="h-5 w-5" />;
      case 'portfolio_optimization':
        return <Upload className="h-5 w-5" />;
      case 'subscription_upgrade':
        return <CreditCard className="h-5 w-5" />;
      case 'support_contact':
        return <HelpCircle className="h-5 w-5" />;
      case 'conversion_opportunity':
        return <Target className="h-5 w-5" />;
      case 'engagement_improvement':
        return <BarChart3 className="h-5 w-5" />;
      case 'trial_ending':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'profile_optimization':
        return 'text-blue-600';
      case 'feature_usage':
        return 'text-green-600';
      case 'search_optimization':
        return 'text-purple-600';
      case 'portfolio_optimization':
        return 'text-orange-600';
      case 'subscription_upgrade':
        return 'text-green-600';
      case 'support_contact':
        return 'text-red-600';
      case 'conversion_opportunity':
        return 'text-green-600';
      case 'engagement_improvement':
        return 'text-red-600';
      case 'trial_ending':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Target className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Recommendations Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to help you get the most from your trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {recommendations.length} recommendations available
            </div>
            <Button
              onClick={generateRecommendations}
              disabled={generating}
              variant="outline"
              size="sm"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              Generate New Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-600 mb-2">
              No recommendations available
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Generate personalized recommendations based on your trial usage
            </div>
            <Button onClick={generateRecommendations} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map(recommendation => (
            <Card
              key={recommendation.id}
              className="border-l-4 border-l-blue-500"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={getRecommendationColor(
                        recommendation.recommendation_type
                      )}
                    >
                      {getRecommendationIcon(
                        recommendation.recommendation_type
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {recommendation.recommendation_type.replace('_', ' ')}
                      </CardTitle>
                      <CardDescription>
                        {recommendation.recommendation_data.message}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getPriorityColor(
                        recommendation.recommendation_data.priority || 'medium'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(
                          recommendation.recommendation_data.priority ||
                            'medium'
                        )}
                        {recommendation.recommendation_data.priority ||
                          'medium'}
                      </div>
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(recommendation.confidence_score * 100)}%
                      confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recommendation.recommendation_data.actions && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Recommended Actions:
                    </div>
                    <ul className="space-y-1">
                      {recommendation.recommendation_data.actions.map(
                        (action, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {action}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {recommendation.recommendation_data.benefits && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Benefits:
                    </div>
                    <ul className="space-y-1">
                      {recommendation.recommendation_data.benefits.map(
                        (benefit, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <Target className="h-3 w-3 text-blue-500" />
                            {benefit}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Additional metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {recommendation.recommendation_data.completion_score && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(
                          recommendation.recommendation_data.completion_score *
                            100
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-500">
                        Profile Completion
                      </div>
                    </div>
                  )}

                  {recommendation.recommendation_data.usage_score && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(
                          recommendation.recommendation_data.usage_score * 100
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-500">Feature Usage</div>
                    </div>
                  )}

                  {recommendation.recommendation_data.conversion_score && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(
                          recommendation.recommendation_data.conversion_score *
                            100
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-500">
                        Conversion Score
                      </div>
                    </div>
                  )}

                  {recommendation.recommendation_data.portfolio_count !==
                    undefined && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {recommendation.recommendation_data.portfolio_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        Portfolio Items
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  {recommendation.recommendation_type ===
                    'subscription_upgrade' && (
                    <Button size="sm">
                      <CreditCard className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  )}

                  {recommendation.recommendation_type === 'support_contact' && (
                    <Button size="sm" variant="outline">
                      <HelpCircle className="h-4 w-4" />
                      Contact Support
                    </Button>
                  )}

                  {recommendation.recommendation_type ===
                    'profile_optimization' && (
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4" />
                      Complete Profile
                    </Button>
                  )}

                  {recommendation.recommendation_type ===
                    'portfolio_optimization' && (
                    <Button size="sm" variant="outline">
                      <Upload className="h-4 w-4" />
                      Upload Portfolio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
