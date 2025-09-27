'use client';

import React, { useState } from 'react';
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
  TrendingUp,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface BudgetRecommendation {
  id: string;
  service_category: string;
  recommended_amount: number;
  confidence_score: number;
  pricing_source: string;
}

interface BudgetRecommendationsProps {
  recommendations: BudgetRecommendation[];
  totalBudget: number;
  onRecommendationUpdate?: (budget: any) => void;
}

export function BudgetRecommendations({
  recommendations,
  totalBudget,
  onRecommendationUpdate,
}: BudgetRecommendationsProps) {
  const [feedback, setFeedback] = useState<
    Record<string, { rating: number; comments: string }>
  >({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (
    recommendationId: string,
    rating: number,
    comments: string
  ) => {
    setIsSubmittingFeedback(true);

    try {
      const response = await fetch('/api/budget/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          feedback_type: 'rating',
          rating,
          comments,
        }),
      });

      if (response.ok) {
        setFeedback(prev => ({
          ...prev,
          [recommendationId]: { rating, comments },
        }));
      }
    } catch (error) {
      } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getPricingSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'historical':
        return <TrendingUp className="h-4 w-4" />;
      case 'contractor':
        return <Star className="h-4 w-4" />;
      case 'industry':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPricingSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'historical':
        return 'bg-blue-100 text-blue-800';
      case 'contractor':
        return 'bg-green-100 text-green-800';
      case 'industry':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Recommendations</CardTitle>
          <CardDescription>
            No recommendations available. Please check your event details and
            try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Make sure you&apos;ve selected an event type and provided location
              information for the most accurate recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered budget recommendations based on your event details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${totalBudget.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Recommended Budget
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Service Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(
                  (recommendations.reduce(
                    (sum, rec) => sum + rec.confidence_score,
                    0
                  ) /
                    recommendations.length) *
                    100
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Average Confidence
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Recommendations */}
      <div className="grid gap-4">
        {recommendations.map(recommendation => (
          <Card
            key={recommendation.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">
                  {recommendation.service_category.replace('_', ' ')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getConfidenceColor(recommendation.confidence_score)} border-current`}
                  >
                    {getConfidenceLabel(recommendation.confidence_score)}
                  </Badge>
                  <Badge
                    className={getPricingSourceColor(
                      recommendation.pricing_source
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {getPricingSourceIcon(recommendation.pricing_source)}
                      {recommendation.pricing_source}
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommendation Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Recommended Amount
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${recommendation.recommended_amount.toLocaleString()}
                </span>
              </div>

              {/* Confidence Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Confidence Score
                  </span>
                  <span
                    className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence_score)}`}
                  >
                    {Math.round(recommendation.confidence_score * 100)}%
                  </span>
                </div>
                <Progress
                  value={recommendation.confidence_score * 100}
                  className="h-2"
                />
              </div>

              {/* Budget Percentage */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Budget Allocation
                </span>
                <span className="text-sm font-medium">
                  {(
                    (recommendation.recommended_amount / totalBudget) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>

              {/* Feedback Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Was this recommendation helpful?
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleFeedbackSubmit(recommendation.id, 5, '')
                      }
                      disabled={isSubmittingFeedback}
                      className="h-8 w-8 p-0"
                      aria-label="Thumbs up"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleFeedbackSubmit(recommendation.id, 1, '')
                      }
                      disabled={isSubmittingFeedback}
                      className="h-8 w-8 p-0"
                      aria-label="Thumbs down"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {feedback[recommendation.id] && (
                  <Alert className="mt-2">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Thank you for your feedback! Your rating helps improve
                      future recommendations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Budget Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Highest Cost Categories</h4>
              <div className="space-y-1">
                {recommendations
                  .sort((a, b) => b.recommended_amount - a.recommended_amount)
                  .slice(0, 3)
                  .map((rec, index) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {rec.service_category.replace('_', ' ')}
                      </span>
                      <span className="font-medium">
                        ${rec.recommended_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Most Reliable Estimates</h4>
              <div className="space-y-1">
                {recommendations
                  .sort((a, b) => b.confidence_score - a.confidence_score)
                  .slice(0, 3)
                  .map((rec, index) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {rec.service_category.replace('_', ' ')}
                      </span>
                      <span className="font-medium">
                        {Math.round(rec.confidence_score * 100)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
