'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle,
} from 'lucide-react';
import { TestimonialCard } from './TestimonialCard';
import { TestimonialResponse } from './TestimonialResponse';

interface Testimonial {
  id: string;
  rating: number;
  review_text: string;
  is_verified: boolean;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
  event_manager: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  inquiry: {
    id: string;
    subject: string;
    created_at: string;
  };
  response?: {
    id: string;
    response_text: string;
    is_approved: boolean;
    is_public: boolean;
    created_at: string;
  };
}

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

interface TestimonialDisplayProps {
  testimonials: Testimonial[];
  ratingSummary: RatingSummary;
  isOwner?: boolean;
  onTestimonialUpdate?: () => void;
}

export function TestimonialDisplay({
  testimonials,
  ratingSummary,
  isOwner = false,
  onTestimonialUpdate,
}: TestimonialDisplayProps) {
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span>Overall Rating</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {ratingSummary.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">out of 5</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(Math.round(ratingSummary.average_rating), 'lg')}
                <span className="text-sm text-gray-600">
                  ({ratingSummary.total_reviews} review
                  {ratingSummary.total_reviews !== 1 ? 's' : ''})
                </span>
              </div>
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
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No testimonials yet</p>
                <p className="text-sm">
                  Be the first to share your experience with this contractor.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          testimonials.map(testimonial => (
            <div key={testimonial.id} className="space-y-4">
              <TestimonialCard
                testimonial={testimonial}
                isOwner={isOwner}
                onUpdate={onTestimonialUpdate}
              />

              {/* Response */}
              {testimonial.response && (
                <div className="ml-8">
                  <TestimonialResponse
                    response={testimonial.response}
                    isOwner={isOwner}
                    onUpdate={onTestimonialUpdate}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
