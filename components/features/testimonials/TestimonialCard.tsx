'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  CheckCircle,
  MessageCircle,
  Flag,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export function TestimonialCard({
  testimonial,
  isOwner = false,
  onUpdate,
}: TestimonialCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    }
    setIsLiked(!isLiked);
  };

  const handleDislike = () => {
    if (isLiked) {
      setIsLiked(false);
    }
    setIsDisliked(!isDisliked);
  };

  const handleFlag = () => {
    // TODO: Implement flagging functionality
    console.log('Flag testimonial:', testimonial.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={testimonial.event_manager.profile_photo_url}
                alt={`${testimonial.event_manager.first_name} ${testimonial.event_manager.last_name}`}
              />
              <AvatarFallback>
                {testimonial.event_manager.first_name[0]}
                {testimonial.event_manager.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  {testimonial.event_manager.first_name}{' '}
                  {testimonial.event_manager.last_name}
                </h4>
                {testimonial.is_verified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDate(testimonial.created_at)}</span>
                <span>•</span>
                <span>Inquiry: {testimonial.inquiry.subject}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {testimonial.is_verified && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {!testimonial.is_approved && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                Pending Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          {renderStars(testimonial.rating)}
          <span className="text-sm text-gray-600">
            {testimonial.rating} star{testimonial.rating !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Review Text */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {testimonial.review_text}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Helpful</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`flex items-center space-x-1 ${
                isDisliked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Not Helpful</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {!isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFlag}
                className="text-gray-500 hover:text-red-600"
              >
                <Flag className="h-4 w-4" />
                <span className="sr-only">Flag inappropriate</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
