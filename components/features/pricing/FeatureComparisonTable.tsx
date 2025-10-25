'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Crown, Zap, ArrowRight } from 'lucide-react';

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

interface FeatureComparisonTableProps {
  tiers: SubscriptionTierInfo[];
}

interface Feature {
  name: string;
  description: string;
  essential: boolean | string;
  showcase: boolean | string;
  spotlight: boolean | string;
  category: string;
}

export function FeatureComparisonTable({ tiers }: FeatureComparisonTableProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const features: Feature[] = [
    {
      name: 'Profile Listings',
      description: 'Create and manage your business profile',
      essential: 'Basic profile',
      showcase: 'Enhanced profile',
      spotlight: 'Premium profile',
      category: 'Profile',
    },
    {
      name: 'Search Visibility',
      description: 'How prominently you appear in search results',
      essential: 'Standard',
      showcase: 'Priority',
      spotlight: 'Top placement',
      category: 'Visibility',
    },
    {
      name: 'Event Listings',
      description: 'Number of events you can create',
      essential: '3 events',
      showcase: 'Unlimited',
      spotlight: 'Unlimited',
      category: 'Events',
    },
    {
      name: 'Portfolio Uploads',
      description: 'Number of portfolio images you can upload',
      essential: '5 images',
      showcase: '50 images',
      spotlight: 'Unlimited',
      category: 'Portfolio',
    },
    {
      name: 'Customer Reviews',
      description: 'Ability to receive and display customer reviews',
      essential: true,
      showcase: true,
      spotlight: true,
      category: 'Reviews',
    },
    {
      name: 'Analytics Dashboard',
      description: 'View detailed analytics about your profile performance',
      essential: false,
      showcase: 'Basic analytics',
      spotlight: 'Advanced analytics',
      category: 'Analytics',
    },
    {
      name: 'Priority Support',
      description: 'Get faster response times for support requests',
      essential: false,
      showcase: true,
      spotlight: true,
      category: 'Support',
    },
    {
      name: 'Featured Listings',
      description: 'Get featured placement in search results',
      essential: false,
      showcase: '1 featured listing',
      spotlight: 'Unlimited featured listings',
      category: 'Visibility',
    },
    {
      name: 'Custom Branding',
      description: 'Add your logo and custom colors to your profile',
      essential: false,
      showcase: false,
      spotlight: true,
      category: 'Branding',
    },
    {
      name: 'API Access',
      description: 'Access to our API for integrations',
      essential: false,
      showcase: false,
      spotlight: true,
      category: 'Technical',
    },
  ];

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'essential':
        return <Star className="h-5 w-5 text-gray-500" />;
      case 'showcase':
        return <Crown className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
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

  const getFeatureIcon = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      );
    }
    return <Check className="h-5 w-5 text-green-500" />;
  };

  const getFeatureDisplay = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 'Included' : 'Not included';
    }
    return value;
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const categories = [...new Set(features.map(f => f.category))];

  if (tiers.length === 0) {
    return (
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
          <p className="text-xl text-muted-foreground">
            Compare features across all subscription tiers
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">
            No subscription tiers available for comparison.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" data-testid="feature-comparison">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
        <p className="text-xl text-muted-foreground">
          Compare features across all subscription tiers
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Desktop Table */}
        <div className="hidden lg:block" data-testid="features-table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th
                        className="text-left p-6 font-medium"
                        data-testid="features-table-header"
                      >
                        Features
                      </th>
                      {tiers.map(tier => (
                        <th key={tier.id} className="text-center p-6">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              {getTierIcon(tier.id)}
                              <span className="font-medium">{tier.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tier.price === 0
                                ? 'Free'
                                : `$${tier.price}/month`}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <React.Fragment key={category}>
                        <tr className="bg-muted/50">
                          <td
                            colSpan={tiers.length + 1}
                            className="p-4 font-medium text-sm"
                          >
                            {category}
                          </td>
                        </tr>
                        {features
                          .filter(f => f.category === category)
                          .map((feature, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">
                                    {feature.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {feature.description}
                                  </div>
                                </div>
                              </td>
                              {tiers.map(tier => {
                                const tierKey = tier.id as keyof Feature;
                                const value = feature[tierKey];
                                return (
                                  <td key={tier.id} className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      {getFeatureIcon(value)}
                                      <span className="text-sm">
                                        {getFeatureDisplay(value)}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div
          className="lg:hidden space-y-6"
          data-testid="features-table-mobile"
        >
          {tiers.map(tier => (
            <Card key={tier.id} className={`${getTierColor(tier.id)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTierIcon(tier.id)}
                  {tier.name}
                  {tier.is_popular && <Badge variant="default">Popular</Badge>}
                </CardTitle>
                <CardDescription>
                  {tier.price === 0 ? 'Free forever' : `$${tier.price}/month`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => (
                    <div key={category}>
                      <h4 className="font-medium text-sm mb-2">{category}</h4>
                      <div className="space-y-2">
                        {features
                          .filter(f => f.category === category)
                          .map((feature, index) => {
                            const tierKey = tier.id as keyof Feature;
                            const value = feature[tierKey];
                            return (
                              <div
                                key={index}
                                className="flex items-start gap-2"
                              >
                                {getFeatureIcon(value)}
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {feature.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {getFeatureDisplay(value)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => handleSelectTier(tier.id)}
                  >
                    Choose {tier.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
