'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp, Users, Award } from 'lucide-react';

interface RatingSummary {
  contractor_id: string;
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  last_updated: string;
}

interface RatingAggregationProps {
  ratingSummary: RatingSummary;
  showDetails?: boolean;
  className?: string;
}

export function RatingAggregation({
  ratingSummary,
  showDetails = false,
  className = '',
}: RatingAggregationProps) {
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.5) return 'Below Average';
    return 'Poor';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-green-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 3.0) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-500';
    return 'text-red-500';
  };

  if (ratingSummary.total_reviews === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No ratings yet</p>
            <p className="text-sm">
              This contractor hasn&apos;t received any testimonials yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>Customer Ratings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${getRatingColor(ratingSummary.average_rating)}`}
              >
                {ratingSummary.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">out of 5</div>
              <div
                className={`text-sm font-medium ${getRatingColor(ratingSummary.average_rating)}`}
              >
                {getRatingLabel(ratingSummary.average_rating)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(Math.round(ratingSummary.average_rating), 'lg')}
                <span className="text-sm text-gray-600">
                  ({ratingSummary.total_reviews} review
                  {ratingSummary.total_reviews !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          </div>

          {showDetails && (
            <>
              {/* Rating Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Rating Breakdown</h4>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count =
                      ratingSummary.rating_breakdown[
                        star.toString() as keyof typeof ratingSummary.rating_breakdown
                      ];
                    const percentage =
                      ratingSummary.total_reviews > 0
                        ? (count / ratingSummary.total_reviews) * 100
                        : 0;

                    return (
                      <div key={star} className="flex items-center space-x-2">
                        <span className="text-sm w-3">{star}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {count}
                        </span>
                        <span className="text-sm text-gray-500 w-12">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {ratingSummary.average_rating >= 4.0
                        ? 'High'
                        : ratingSummary.average_rating >= 3.0
                          ? 'Medium'
                          : 'Low'}{' '}
                      Quality
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Quality Score</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {ratingSummary.total_reviews}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Award className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {ratingSummary.rating_breakdown['5']}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">5-Star Reviews</div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
