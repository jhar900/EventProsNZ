'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, MapPin, Calendar } from 'lucide-react';

interface HeroSectionProps {
  className?: string;
  onRegisterClick?: () => void;
}

export function HeroSection({
  className = '',
  onRegisterClick,
}: HeroSectionProps) {
  return (
    <section
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
        {/* Removed hero-pattern.svg as it doesn't exist */}
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          New Zealand&apos;s Premier
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
            Event Ecosystem
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Connect with qualified contractors, plan unforgettable events, and
          grow your business in New Zealand&apos;s thriving event industry.
        </p>

        {/* Key benefits */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm sm:text-base">
          <div className="flex items-center gap-2 text-gray-700">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>5-Star Rated Contractors</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5 text-orange-500" />
            <span>Trusted by 1000+ Event Managers</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>Nationwide Coverage</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span>Events Planned Daily</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          {onRegisterClick ? (
            <Button
              size="lg"
              onClick={onRegisterClick}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link href="/contractors" prefetch={true}>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              Browse Contractors
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">
              500+
            </div>
            <div className="text-sm text-gray-600">Verified Contractors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
              1000+
            </div>
            <div className="text-sm text-gray-600">Events Planned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">
              98%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">
              24/7
            </div>
            <div className="text-sm text-gray-600">Support Available</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
