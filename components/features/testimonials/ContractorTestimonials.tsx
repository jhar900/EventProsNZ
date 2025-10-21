'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { TestimonialDisplay } from './TestimonialDisplay';
import { TestimonialCreation } from './TestimonialCreation';
import { RatingAggregation } from './RatingAggregation';
import { TestimonialList } from './TestimonialList';
import { TestimonialFilters } from './TestimonialFilters';
import { TestimonialSearch } from './TestimonialSearch';

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

interface ContractorTestimonialsProps {
  contractorId: string;
  isOwner?: boolean;
  canCreateTestimonial?: boolean;
}

export function ContractorTestimonials({
  contractorId,
  isOwner = false,
  canCreateTestimonial = false,
}: ContractorTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    rating: '',
    verified: '',
    approved: '',
    search: '',
  });

  useEffect(() => {
    fetchTestimonials();
    fetchRatingSummary();
  }, [contractorId, filters]);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        contractor_id: contractorId,
        is_public: 'true',
        ...filters,
      });

      const response = await fetch(`/api/testimonials/display?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }

      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRatingSummary = async () => {
    try {
      const response = await fetch(
        `/api/testimonials/display/summary?contractor_id=${contractorId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch rating summary');
      }

      const data = await response.json();
      setRatingSummary(data.rating_summary);
    } catch (err) {
      console.error('Error fetching rating summary:', err);
    }
  };

  const handleTestimonialCreated = () => {
    setShowCreateForm(false);
    fetchTestimonials();
    fetchRatingSummary();
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button
              onClick={() => {
                setError(null);
                fetchTestimonials();
              }}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratingSummary && (
        <RatingAggregation ratingSummary={ratingSummary} showDetails={true} />
      )}

      {/* Create Testimonial Button */}
      {canCreateTestimonial && !showCreateForm && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Have you worked with this contractor? Share your experience!
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Write a Testimonial
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Testimonial Form */}
      {showCreateForm && (
        <TestimonialCreation
          contractorId={contractorId}
          onSuccess={handleTestimonialCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <TestimonialFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        <TestimonialSearch
          onSearch={handleSearch}
          placeholder="Search testimonials..."
        />
      </div>

      {/* Testimonials List */}
      <TestimonialList
        testimonials={testimonials}
        isOwner={isOwner}
        onTestimonialUpdate={fetchTestimonials}
      />

      {/* Empty State */}
      {testimonials.length === 0 && !isLoading && (
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
      )}
    </div>
  );
}
