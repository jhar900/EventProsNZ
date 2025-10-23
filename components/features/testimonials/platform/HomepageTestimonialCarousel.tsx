'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Pause, Star } from 'lucide-react';
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

interface HomepageTestimonialCarouselProps {
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  maxTestimonials?: number;
}

export function HomepageTestimonialCarousel({
  className,
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  maxTestimonials = 10,
}: HomepageTestimonialCarouselProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (isPlaying && !isHovered && testimonials.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % testimonials.length);
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isHovered, testimonials.length, autoPlayInterval]);

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

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
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

  const renderTestimonial = (testimonial: Testimonial, index: number) => {
    const isActive = index === currentIndex;
    const isPrev =
      index === (currentIndex - 1 + testimonials.length) % testimonials.length;
    const isNext = index === (currentIndex + 1) % testimonials.length;

    return (
      <div
        key={testimonial.id}
        className={cn(
          'absolute inset-0 transition-all duration-500 ease-in-out',
          isActive ? 'opacity-100 translate-x-0' : 'opacity-0',
          isPrev ? '-translate-x-full' : '',
          isNext ? 'translate-x-full' : ''
        )}
      >
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="text-center space-y-4">
              {/* Rating */}
              <div className="flex justify-center space-x-1">
                {renderStars(testimonial.rating)}
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-lg italic text-gray-700 max-w-2xl mx-auto">
                &ldquo;{testimonial.feedback}&rdquo;
              </blockquote>

              {/* User Info */}
              <div className="flex items-center justify-center space-x-3">
                {testimonial.user.profile_photo_url ? (
                  <img
                    src={testimonial.user.profile_photo_url}
                    alt={`${testimonial.user.first_name} ${testimonial.user.last_name}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {testimonial.user.first_name[0]}
                      {testimonial.user.last_name[0]}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    {testimonial.user.first_name} {testimonial.user.last_name}
                  </p>
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={cn(
          'w-full h-64 flex items-center justify-center',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'w-full h-64 flex items-center justify-center',
          className
        )}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load testimonials</p>
          <Button onClick={fetchTestimonials} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div
        className={cn(
          'w-full h-64 flex items-center justify-center',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <p>No testimonials available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full h-64 overflow-hidden', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={containerRef}
    >
      {/* Testimonials */}
      {testimonials.map((testimonial, index) =>
        renderTestimonial(testimonial, index)
      )}

      {/* Controls */}
      {showControls && testimonials.length > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
            onClick={prevTestimonial}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
            onClick={nextTestimonial}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Play/Pause Button */}
      {testimonials.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 z-10"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Indicators */}
      {showIndicators && testimonials.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              )}
              onClick={() => goToTestimonial(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
