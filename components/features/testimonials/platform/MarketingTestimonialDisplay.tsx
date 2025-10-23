'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  rating: number;
  feedback: string;
  category: 'event_manager' | 'contractor';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  approved_at?: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

interface MarketingTestimonialDisplayProps {
  variant?: 'carousel' | 'grid' | 'hero' | 'sidebar';
  maxTestimonials?: number;
  showStats?: boolean;
  showCTA?: boolean;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function MarketingTestimonialDisplay({
  variant = 'grid',
  maxTestimonials = 6,
  showStats = true,
  showCTA = true,
  className,
  autoPlay = true,
  autoPlayInterval = 5000,
}: MarketingTestimonialDisplayProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (isPlaying && testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % testimonials.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isPlaying, testimonials.length, autoPlayInterval]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/testimonials/platform?status=approved&limit=${maxTestimonials}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch testimonials');
      }

      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch testimonials'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        )}
      />
    ));
  };

  const renderTestimonialCard = (testimonial: Testimonial, index?: number) => (
    <Card key={testimonial.id} className="h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center space-x-1 mb-4">
          {renderStars(testimonial.rating)}
        </div>

        <blockquote className="text-gray-700 italic mb-4 flex-1">
          &ldquo;{testimonial.feedback}&rdquo;
        </blockquote>

        <div className="flex items-center space-x-3">
          {testimonial.user.profile_photo_url ? (
            <img
              src={testimonial.user.profile_photo_url}
              alt={`${testimonial.user.first_name} ${testimonial.user.last_name}`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">
                {testimonial.user.first_name[0]}
                {testimonial.user.last_name[0]}
              </span>
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">
              {testimonial.user.first_name} {testimonial.user.last_name}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {testimonial.category === 'event_manager'
                  ? 'Event Manager'
                  : 'Contractor'}
              </Badge>
              {testimonial.is_verified && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-100 text-green-800"
                >
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCarousel = () => (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {testimonials.map((testimonial, index) => (
          <div key={testimonial.id} className="w-full flex-shrink-0">
            {renderTestimonialCard(testimonial, index)}
          </div>
        ))}
      </div>

      {testimonials.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map(testimonial => renderTestimonialCard(testimonial))}
    </div>
  );

  const renderHero = () => {
    if (testimonials.length === 0) return null;

    const testimonial = testimonials[currentIndex];
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center space-x-1 mb-4">
          {renderStars(testimonial.rating)}
        </div>

        <blockquote className="text-2xl md:text-3xl font-light italic text-gray-800 max-w-4xl mx-auto">
          &ldquo;{testimonial.feedback}&rdquo;
        </blockquote>

        <div className="flex items-center justify-center space-x-4">
          {testimonial.user.profile_photo_url ? (
            <img
              src={testimonial.user.profile_photo_url}
              alt={`${testimonial.user.first_name} ${testimonial.user.last_name}`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">
                {testimonial.user.first_name[0]}
                {testimonial.user.last_name[0]}
              </span>
            </div>
          )}
          <div className="text-left">
            <div className="font-semibold text-lg text-gray-900">
              {testimonial.user.first_name} {testimonial.user.last_name}
            </div>
            <div className="text-gray-600">
              {testimonial.category === 'event_manager'
                ? 'Event Manager'
                : 'Contractor'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="space-y-4">
      {testimonials.slice(0, 3).map(testimonial => (
        <Card key={testimonial.id} className="p-4">
          <div className="flex items-center space-x-1 mb-2">
            {renderStars(testimonial.rating)}
          </div>
          <blockquote className="text-sm italic text-gray-700 mb-3">
            &ldquo;
            {testimonial.feedback.length > 100
              ? `${testimonial.feedback.substring(0, 100)}...`
              : testimonial.feedback}
            &rdquo;
          </blockquote>
          <div className="text-xs text-gray-600">
            — {testimonial.user.first_name} {testimonial.user.last_name}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderStats = () => {
    if (!showStats || testimonials.length === 0) return null;

    const averageRating =
      testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;
    const verifiedCount = testimonials.filter(t => t.is_verified).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{testimonials.length}</span>
            </div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{verifiedCount}</span>
            </div>
            <div className="text-sm text-gray-600">Verified Users</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCTA = () => {
    if (!showCTA) return null;

    return (
      <div className="text-center mt-8">
        <h3 className="text-xl font-semibold mb-2">Share Your Experience</h3>
        <p className="text-gray-600 mb-4">
          Help others by sharing your experience with Event Pros NZ
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Quote className="h-4 w-4 mr-2" />
          Write a Review
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-600 mb-4">Failed to load testimonials</p>
        <Button onClick={fetchTestimonials} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-500">
          <Quote className="h-12 w-12 mx-auto mb-4" />
          <p>No testimonials available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {renderStats()}

      {variant === 'carousel' && renderCarousel()}
      {variant === 'grid' && renderGrid()}
      {variant === 'hero' && renderHero()}
      {variant === 'sidebar' && renderSidebar()}

      {renderCTA()}
    </div>
  );
}
