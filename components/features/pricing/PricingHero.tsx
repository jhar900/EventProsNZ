'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Crown, Zap } from 'lucide-react';

export function PricingHero() {
  return (
    <div
      className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20"
      data-testid="pricing-hero"
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6"
            data-testid="pricing-hero-badge"
          >
            <Star className="h-4 w-4 mr-2" />
            14-day free trial on all paid plans
          </Badge>

          {/* Main Heading */}
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            data-testid="pricing-hero-title"
          >
            Simple, transparent <span className="text-primary">pricing</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            data-testid="pricing-hero-subtitle"
          >
            Choose the perfect plan for your event planning business. Start
            free, upgrade when you&apos;re ready, and scale as you grow.
          </p>

          {/* Key Benefits */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            data-testid="pricing-hero-benefits"
          >
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No setup fees</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>30-day money-back guarantee</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            data-testid="pricing-hero-cta-buttons"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              data-testid="pricing-hero-start-trial-btn"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              data-testid="pricing-hero-view-features-btn"
            >
              View All Features
            </Button>
          </div>

          {/* Trust Indicators */}
          <div
            className="mt-16 pt-8 border-t border-border/50"
            data-testid="pricing-hero-trust-indicators"
          >
            <p
              className="text-sm text-muted-foreground mb-6"
              data-testid="pricing-hero-trust-text"
            >
              Trusted by event planners across New Zealand
            </p>
            <div
              className="flex items-center justify-center gap-8 opacity-60"
              data-testid="pricing-hero-stats"
            >
              <div className="text-2xl font-bold">500+</div>
              <div className="text-2xl font-bold">Active Users</div>
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-2xl font-bold">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
