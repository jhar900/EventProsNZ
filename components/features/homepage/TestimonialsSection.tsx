'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  content: string;
  avatar?: string;
  verified: boolean;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
  className?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Event Manager',
    company: 'Wellington Events Co.',
    rating: 5,
    content:
      'Event Pros NZ transformed how we plan events. The contractor matching is incredible - we found the perfect photographer and caterer within hours!',
    verified: true,
  },
  {
    id: '2',
    name: 'James Thompson',
    role: 'Wedding Planner',
    company: 'Auckland Weddings',
    rating: 5,
    content:
      "The platform saved us weeks of research. Every contractor we've worked with through Event Pros NZ has been professional and delivered exceptional results.",
    verified: true,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    role: 'Corporate Events',
    company: 'Christchurch Business Events',
    rating: 5,
    content:
      'Outstanding service! The AI recommendations helped us discover contractors we never would have found. Our corporate events have never been better.',
    verified: true,
  },
  {
    id: '4',
    name: 'Michael Chen',
    role: 'Party Planner',
    company: 'Dunedin Celebrations',
    rating: 5,
    content:
      'The budget planning tools are game-changing. We stayed within budget while delivering a spectacular event. Highly recommend!',
    verified: true,
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    role: 'Event Coordinator',
    company: 'Hamilton Events',
    rating: 5,
    content:
      "The CRM features help us manage all our client relationships in one place. It's made our business so much more efficient.",
    verified: true,
  },
  {
    id: '6',
    name: 'David Roberts',
    role: 'Conference Organizer',
    company: 'Tauranga Conferences',
    rating: 5,
    content:
      "The platform handles everything from contractor matching to payment processing. It's like having a full event team at your fingertips.",
    verified: true,
  },
];

export function TestimonialsSection({
  testimonials = defaultTestimonials,
  className = '',
}: TestimonialsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scroll = () => {
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 0.5;
      }
    };

    const interval = setInterval(scroll, 20);
    return () => clearInterval(interval);
  }, []);

  const handleMouseEnter = () => setIsScrolling(true);
  const handleMouseLeave = () => setIsScrolling(false);

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className={`py-20 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover why event managers and contractors trust Event Pros NZ to
            deliver exceptional results
          </p>
        </div>

        {/* Testimonials carousel */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-hidden gap-6 cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            scrollBehavior: isScrolling ? 'auto' : 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                {testimonial.verified && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              {/* Quote */}
              <div className="relative mb-4">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
                <p className="text-gray-700 leading-relaxed relative z-10">
                  &quot;{testimonial.content}&quot;
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonial.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Scroll to see more testimonials</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
