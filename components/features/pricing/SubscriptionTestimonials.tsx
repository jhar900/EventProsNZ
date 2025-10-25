'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface PricingTestimonial {
  id: string;
  contractor_id: string;
  contractor_name: string;
  content: string;
  rating: number;
  tier: string;
  is_featured: boolean;
}

interface SubscriptionTestimonialsProps {
  testimonials: PricingTestimonial[];
}

export function SubscriptionTestimonials({
  testimonials,
}: SubscriptionTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  const filteredTestimonials =
    filter === 'all'
      ? testimonials
      : testimonials.filter(t => t.tier === filter);

  const currentTestimonial = filteredTestimonials[currentIndex];

  const nextTestimonial = () => {
    setCurrentIndex(prev =>
      prev === filteredTestimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex(prev =>
      prev === 0 ? filteredTestimonials.length - 1 : prev - 1
    );
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'showcase':
        return <Badge variant="default">Showcase</Badge>;
      case 'spotlight':
        return <Badge variant="destructive">Spotlight</Badge>;
      default:
        return <Badge variant="secondary">Essential</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16" data-testid="testimonials-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          What Our <span className="text-primary">Contractors</span> Say
        </h2>
        <p className="text-xl text-muted-foreground">
          See how EventProsNZ has helped event planners grow their business
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Plans
          </Button>
          <Button
            variant={filter === 'showcase' ? 'default' : 'outline'}
            onClick={() => setFilter('showcase')}
            size="sm"
          >
            Showcase
          </Button>
          <Button
            variant={filter === 'spotlight' ? 'default' : 'outline'}
            onClick={() => setFilter('spotlight')}
            size="sm"
          >
            Spotlight
          </Button>
        </div>

        {/* Testimonial Carousel */}
        {currentTestimonial && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Quote Icon */}
                <div className="flex justify-center">
                  <Quote className="h-12 w-12 text-primary/20" />
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-xl italic text-muted-foreground leading-relaxed">
                  &quot;{currentTestimonial.content}&quot;
                </blockquote>

                {/* Rating */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-1">
                    {renderStars(currentTestimonial.rating)}
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`/avatars/${currentTestimonial.contractor_id}.jpg`}
                    />
                    <AvatarFallback>
                      {currentTestimonial.contractor_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">
                      {currentTestimonial.contractor_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Event Planner
                    </div>
                  </div>
                  {getTierBadge(currentTestimonial.tier)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={prevTestimonial}
            disabled={filteredTestimonials.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-2">
            {filteredTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextTestimonial}
            disabled={filteredTestimonials.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">
              Active Contractors
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">95%</div>
            <div className="text-sm text-muted-foreground">
              Customer Satisfaction
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
