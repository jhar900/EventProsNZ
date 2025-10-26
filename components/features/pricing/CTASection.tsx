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
import {
  ArrowRight,
  Check,
  Star,
  Crown,
  Zap,
  Gift,
  Shield,
  Clock,
} from 'lucide-react';

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  price_annual: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
  is_popular?: boolean;
}

interface CTASectionProps {
  tiers: SubscriptionTierInfo[];
}

export function CTASection({ tiers }: CTASectionProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const ctaBenefits = [
    {
      icon: <Gift className="h-6 w-6 text-green-500" />,
      title: '14-Day Free Trial',
      description: 'Try all premium features risk-free',
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      title: '30-Day Money-Back Guarantee',
      description: 'Full refund if not satisfied',
    },
    {
      icon: <Clock className="h-6 w-6 text-yellow-500" />,
      title: 'Cancel Anytime',
      description: 'No long-term commitments',
    },
  ];

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'essential':
        return <Star className="h-6 w-6 text-gray-500" />;
      case 'showcase':
        return <Crown className="h-6 w-6 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-6 w-6 text-yellow-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    console.log('Selected tier for CTA:', tierId);
  };

  const handleStartTrial = (tier: SubscriptionTierInfo) => {
    console.log('Starting trial for:', tier.id);
  };

  const handleGetStarted = () => {
    console.log('Getting started with free plan');
  };

  return (
    <section
      className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5"
      data-testid="cta-section"
    >
      <div className="max-w-6xl mx-auto">
        {/* Main CTA */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Gift className="h-4 w-4 mr-2" />
            Limited Time: 14-Day Free Trial
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Ready to Grow Your{' '}
            <span className="text-primary">Event Business</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of event planners who trust EventProsNZ to connect
            them with the best contractors and grow their business.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {ctaBenefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="font-medium mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tier Selection */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {tiers.map(tier => (
            <Card
              key={tier.id}
              className={`relative transition-all duration-200 ${
                selectedTier === tier.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              } ${tier.is_popular ? 'border-primary' : ''}`}
            >
              {tier.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {getTierIcon(tier.id)}
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>
                  {tier.id === 'essential' && 'Perfect for getting started'}
                  {tier.id === 'showcase' && 'Ideal for growing businesses'}
                  {tier.id === 'spotlight' && 'Maximum visibility and features'}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  </div>
                  <div className="text-muted-foreground">
                    {tier.price === 0 ? 'forever' : '/month'}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {tier.id === 'essential' ? (
                    <Button
                      className="w-full"
                      data-testid="cta-get-started-free-btn"
                      onClick={() => handleGetStarted()}
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        data-testid={`cta-tier-${tier.id}-start-trial-btn`}
                        onClick={() => handleStartTrial(tier)}
                      >
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSelectTier(tier.id)}
                      >
                        Choose {tier.name}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
              <div className="text-sm text-muted-foreground">
                Average Rating
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">
              Join Event Planners Across New Zealand
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              &quot;EventProsNZ has transformed how I find and work with
              contractors. The quality of matches and ease of communication is
              unmatched.&quot;
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>— Sarah M., Wedding Planner</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Start Your Journey Today</h3>
            <p className="text-muted-foreground">
              No credit card required. Cancel anytime. 30-day money-back
              guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                data-testid="cta-final-start-trial-btn"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View All Features
              </Button>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span
              className="flex items-center gap-1"
              data-testid="no-setup-fees"
            >
              <Check className="h-4 w-4 text-green-500" />
              No setup fees
            </span>
            <span
              className="flex items-center gap-1"
              data-testid="cta-cancel-anytime"
            >
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </span>
            <span
              className="flex items-center gap-1"
              data-testid="cta-money-back-guarantee"
            >
              <Check className="h-4 w-4 text-green-500" />
              30-day guarantee
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              Priority support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
