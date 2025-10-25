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
import { Check, Star, Crown, Zap, ArrowRight } from 'lucide-react';

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

interface SubscriptionTiersProps {
  tiers: SubscriptionTierInfo[];
}

export function SubscriptionTiers({ tiers }: SubscriptionTiersProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );

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

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'essential':
        return 'border-gray-200';
      case 'showcase':
        return 'border-blue-200';
      case 'spotlight':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  const getTierDescription = (tierId: string) => {
    switch (tierId) {
      case 'essential':
        return 'Perfect for getting started';
      case 'showcase':
        return 'Ideal for growing businesses';
      case 'spotlight':
        return 'Maximum visibility and features';
      default:
        return '';
    }
  };

  const getPrice = (tier: SubscriptionTierInfo) => {
    return billingCycle === 'annual' ? tier.price_annual : tier.price;
  };

  const getSavings = (tier: SubscriptionTierInfo) => {
    if (billingCycle === 'annual' && tier.price > 0) {
      const monthlyTotal = tier.price * 12;
      const savings = monthlyTotal - tier.price_annual;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const handleSubscribe = (tier: SubscriptionTierInfo) => {
    // This would integrate with the subscription system
    console.log('Subscribe to tier:', tier.id);
  };

  if (tiers.length === 0) {
    return (
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with our free plan and upgrade as you grow
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">
            No subscription tiers available at this time.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Start with our free plan and upgrade as you grow
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span
            className={`text-sm ${billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}`}
            data-testid="monthly-toggle"
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')
            }
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="switch"
            aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
            aria-checked={billingCycle === 'annual'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className={`text-sm ${billingCycle === 'annual' ? 'font-medium' : 'text-muted-foreground'}`}
            data-testid="annual-toggle"
          >
            Annual
          </span>
          {billingCycle === 'annual' && (
            <Badge
              variant="secondary"
              className="ml-2"
              data-testid="annual-savings"
            >
              Save up to 20%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {tiers.map(tier => {
          const price = getPrice(tier);
          const savings = getSavings(tier);
          const isPopular = tier.is_popular;
          const isSelected = selectedTier === tier.id;

          return (
            <Card
              key={tier.id}
              data-testid={`tier-${tier.id}`}
              className={`relative transition-all duration-200 ${
                isPopular
                  ? 'ring-2 ring-primary shadow-lg scale-105'
                  : isSelected
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
              } ${getTierColor(tier.id)}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              {savings > 0 && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="destructive">Save {savings}%</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getTierIcon(tier.id)}
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-base">
                  {getTierDescription(tier.id)}
                </CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span
                      className="text-5xl font-bold"
                      data-testid={`price-${tier.id}`}
                    >
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground ml-2">
                        /{billingCycle === 'annual' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Save ${tier.price * 12 - tier.price_annual} per year
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {tier.features.length > 6 && (
                    <li className="text-sm text-muted-foreground">
                      +{tier.features.length - 6} more features
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                <div className="pt-4">
                  {tier.id === 'essential' ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      data-testid={`get-started-${tier.id}`}
                      onClick={() => handleSelectTier(tier.id)}
                    >
                      Get Started Free
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {tier.is_trial_eligible && (
                        <Button
                          className="w-full"
                          variant="outline"
                          data-testid="start-free-trial-btn"
                          onClick={() => handleSelectTier(tier.id)}
                        >
                          Start Free Trial
                        </Button>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(tier)}
                      >
                        Choose {tier.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground mb-4">
          All plans include 24/7 support and regular updates
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span data-testid="no-setup-fees">✓ No setup fees</span>
          <span data-testid="tiers-cancel-anytime">✓ Cancel anytime</span>
          <span data-testid="tiers-money-back-guarantee">
            ✓ 30-day money-back guarantee
          </span>
        </div>
      </div>
    </section>
  );
}
