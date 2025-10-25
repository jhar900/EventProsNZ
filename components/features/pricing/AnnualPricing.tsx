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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Star, Crown, Zap, ArrowRight, Percent } from 'lucide-react';

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

interface AnnualPricingProps {
  tiers: SubscriptionTierInfo[];
}

export function AnnualPricing({ tiers }: AnnualPricingProps) {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>(
    'annual'
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

  const getPrice = (tier: SubscriptionTierInfo) => {
    return selectedCycle === 'annual' ? tier.price_annual : tier.price;
  };

  const getSavings = (tier: SubscriptionTierInfo) => {
    if (selectedCycle === 'annual' && tier.price > 0) {
      const monthlyTotal = tier.price * 12;
      const savings = monthlyTotal - tier.price_annual;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  const getMonthlyEquivalent = (tier: SubscriptionTierInfo) => {
    if (selectedCycle === 'annual' && tier.price_annual > 0) {
      return Math.round(tier.price_annual / 12);
    }
    return tier.price;
  };

  const handleSelectTier = (tier: SubscriptionTierInfo) => {
    console.log('Selected tier:', tier.id, 'Cycle:', selectedCycle);
  };

  if (tiers.length === 0) {
    return null;
  }

  return (
    <section className="py-16" data-testid="pricing-comparison">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Annual Plans Save You Money</h2>
        <p className="text-xl text-muted-foreground">
          Get up to 20% off when you pay annually
        </p>
      </div>

      <Tabs
        value={selectedCycle}
        onValueChange={value => setSelectedCycle(value as 'monthly' | 'annual')}
      >
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger
              value="monthly"
              data-testid="annual-pricing-monthly-toggle"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="annual"
              className="relative"
              data-testid="annual-pricing-annual-toggle"
            >
              Annual
              <Badge
                variant="secondary"
                className="ml-2 text-xs"
                data-testid="annual-savings"
              >
                Save 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedCycle} className="space-y-8">
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {tiers.map(tier => {
              const price = getPrice(tier);
              const savings = getSavings(tier);
              const monthlyEquivalent = getMonthlyEquivalent(tier);
              const isPopular = tier.is_popular;

              return (
                <Card
                  key={tier.id}
                  className={`relative transition-all duration-200 ${
                    isPopular
                      ? 'ring-2 ring-primary shadow-lg scale-105'
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
                      <Badge variant="destructive">
                        <Percent className="h-3 w-3 mr-1" />
                        Save {savings}%
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      {getTierIcon(tier.id)}
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.id === 'essential' && 'Free forever'}
                      {tier.id === 'showcase' &&
                        'Perfect for growing businesses'}
                      {tier.id === 'spotlight' &&
                        'Maximum visibility and features'}
                    </CardDescription>
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-bold">
                          {price === 0 ? 'Free' : `$${price}`}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          /{selectedCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                      {selectedCycle === 'annual' && price > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            ${monthlyEquivalent}/month
                          </p>
                          <p className="text-sm text-green-600">
                            Save ${tier.price * 12 - tier.price_annual} per year
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Key Features */}
                    <ul className="space-y-3">
                      {tier.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Annual Benefits */}
                    {selectedCycle === 'annual' && price > 0 && (
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Annual Benefits
                        </h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>
                            • Save ${tier.price * 12 - tier.price_annual} per
                            year
                          </li>
                          <li>• Priority customer support</li>
                          <li>• Early access to new features</li>
                          <li>• Free setup consultation</li>
                        </ul>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                      {tier.id === 'essential' ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleSelectTier(tier)}
                        >
                          Get Started Free
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          {tier.is_trial_eligible && (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleSelectTier(tier)}
                            >
                              Start Free Trial
                            </Button>
                          )}
                          <Button
                            className="w-full"
                            onClick={() => handleSelectTier(tier)}
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

          {/* Pricing Comparison Table */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Pricing Comparison</CardTitle>
              <CardDescription>
                See how much you save with annual billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-center p-4">Monthly</th>
                      <th className="text-center p-4">Annual</th>
                      <th className="text-center p-4">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map(tier => {
                      const monthlyTotal = tier.price * 12;
                      const savings = monthlyTotal - tier.price_annual;
                      const savingsPercent =
                        tier.price > 0
                          ? Math.round((savings / monthlyTotal) * 100)
                          : 0;

                      return (
                        <tr key={tier.id} className="border-b">
                          <td className="p-4 font-medium">{tier.name}</td>
                          <td className="p-4 text-center">
                            {tier.price === 0 ? 'Free' : `$${tier.price}/month`}
                          </td>
                          <td className="p-4 text-center">
                            {tier.price_annual === 0
                              ? 'Free'
                              : `$${tier.price_annual}/year`}
                          </td>
                          <td className="p-4 text-center">
                            {savingsPercent > 0 ? (
                              <span className="text-green-600 font-medium">
                                Save {savingsPercent}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
