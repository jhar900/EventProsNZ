'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  StarIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Testimonial {
  id: string;
  clientName: string;
  rating: number;
  comment?: string;
  eventTitle?: string;
  eventDate?: string;
  isVerified: boolean;
  createdAt: string;
}

interface TestimonialsSectionProps {
  contractorId: string;
  initialTestimonials?: Testimonial[];
  initialAverageRating?: number;
  initialReviewCount?: number;
  className?: string;
  onError?: (error: Error) => void;
}

export function TestimonialsSection({
  contractorId,
  initialTestimonials = [],
  initialAverageRating = 0,
  initialReviewCount = 0,
  className = '',
  onError,
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [ratingDistribution, setRatingDistribution] = useState<
    Array<{ rating: number; count: number }>
  >([]);
  const [showFilters, setShowFilters] = useState(false);

  const loadTestimonials = async (pageNum: number = 1, rating: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });

      if (rating) {
        params.append('rating', rating);
      }

      const response = await fetch(
        `/api/contractors/${contractorId}/reviews?${params}`
      );
      const data = await response.json();

      if (response.ok) {
        if (pageNum === 1) {
          setTestimonials(data.reviews);
        } else {
          setTestimonials(prev => [...prev, ...data.reviews]);
        }
        setHasMore(pageNum < data.totalPages);
        setAverageRating(data.averageRating);
        setReviewCount(data.total);
        setRatingDistribution(data.ratingDistribution || []);
      } else {
        const errorMessage = data.error || 'Failed to load testimonials';
        setError(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Network error loading testimonials';
      setError(errorMessage);
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTestimonials.length === 0) {
      loadTestimonials(1, selectedRating);
    }
  }, [contractorId, selectedRating]);

  const handleRatingFilter = (rating: string) => {
    setSelectedRating(rating);
    setPage(1);
    setHasMore(true);
    loadTestimonials(1, rating);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTestimonials(nextPage, selectedRating);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarSolidIcon
          key={i}
          className={`${sizeClasses[size]} text-yellow-400`}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarSolidIcon className={`${sizeClasses[size]} text-yellow-400`} />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      );
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingPercentage = (rating: number) => {
    const total = ratingDistribution.reduce((sum, r) => sum + r.count, 0);
    const count = ratingDistribution.find(r => r.rating === rating)?.count || 0;
    return total > 0 ? (count / total) * 100 : 0;
  };

  if (loading && testimonials.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading reviews...</p>
        </div>
      </Card>
    );
  }

  if (error && testimonials.length === 0) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Reviews
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => loadTestimonials(1, selectedRating)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (testimonials.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Reviews
        </h3>
        <div className="text-center py-8">
          <StarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Reviews Yet
          </h4>
          <p className="text-gray-600">
            Be the first to leave a review for this contractor.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`testimonials-section ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Reviews
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Badge variant="secondary" className="text-sm">
              {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Rating Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-2">
              <div className="flex items-center mr-2">
                {renderStars(averageRating, 'lg')}
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-gray-600">
              Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="lg:col-span-2">
            <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const percentage = getRatingPercentage(rating);
                const count =
                  ratingDistribution.find(r => r.rating === rating)?.count || 0;

                return (
                  <div key={rating} className="flex items-center">
                    <div className="flex items-center w-8">
                      <span className="text-sm text-gray-600">{rating}</span>
                      <StarSolidIcon className="h-4 w-4 text-yellow-400 ml-1" />
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Filter by Rating</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRating === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRatingFilter('')}
              >
                All Ratings
              </Button>
              {[5, 4, 3, 2, 1].map(rating => {
                const count =
                  ratingDistribution.find(r => r.rating === rating)?.count || 0;
                return (
                  <Button
                    key={rating}
                    variant={
                      selectedRating === rating.toString()
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => handleRatingFilter(rating.toString())}
                  >
                    <div className="flex items-center">
                      {renderStars(rating, 'sm')}
                      <span className="ml-1">({count})</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Testimonials List */}
        <div className="space-y-4">
          {testimonials.map(testimonial => (
            <div
              key={testimonial.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {testimonial.clientName}
                    </h4>
                    {testimonial.isVerified && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {testimonial.eventTitle && (
                    <p className="text-sm text-gray-600 mb-2">
                      Event: {testimonial.eventTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(testimonial.rating, 'sm')}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(testimonial.createdAt)}
                  </span>
                </div>
              </div>

              {testimonial.comment && (
                <p className="text-gray-700 leading-relaxed">
                  &ldquo;{testimonial.comment}&rdquo;
                </p>
              )}

              {testimonial.eventDate && (
                <div className="mt-2 text-sm text-gray-500">
                  Event Date: {formatDate(testimonial.eventDate)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-6">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
              className="min-w-32"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Load More Reviews'
              )}
            </Button>
          </div>
        )}

        {/* Write Review CTA */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <h5 className="font-medium text-gray-900 mb-2">
              Share Your Experience
            </h5>
            <p className="text-sm text-gray-600 mb-4">
              Have you worked with this contractor? Leave a review to help
              others make informed decisions.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Write a Review
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
