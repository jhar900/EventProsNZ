'use client';

import React from 'react';
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

interface TestimonialListProps {
  testimonials: Testimonial[];
  isOwner?: boolean;
  onTestimonialUpdate?: () => void;
}

export function TestimonialList({
  testimonials,
  isOwner = false,
  onTestimonialUpdate,
}: TestimonialListProps) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {testimonials.map(testimonial => (
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
      ))}
    </div>
  );
}
