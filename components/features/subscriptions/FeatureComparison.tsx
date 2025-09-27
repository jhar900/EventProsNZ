'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Crown, Star, Zap, CheckCircle } from 'lucide-react';

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
}

interface Subscription {
  id: string;
  tier: 'essential' | 'showcase' | 'spotlight';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | '2year';
  price: number;
  start_date: string;
  end_date?: string;
  trial_end_date?: string;
  promotional_code?: string;
}

interface SubscriptionFeature {
  id: string;
  tier: string;
  feature_name: string;
  feature_description: string | null;
  is_included: boolean;
  limit_value: number | null;
}

interface FeatureComparisonProps {
  tiers: SubscriptionTierInfo[];
  currentSubscription?: Subscription | null;
}

export function FeatureComparison({
  tiers,
  currentSubscription,
}: FeatureComparisonProps) {
  const [features, setFeatures] = useState<
    Record<string, SubscriptionFeature[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/features');
      if (!response.ok) {
        throw new Error('Failed to load features');
      }

      const data = await response.json();
      setFeatures(data.features);
    } catch (err) {
      setError('Failed to load features');
      } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
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

  const getTierDisplayName = (tier: string) => {
    const names = {
      essential: 'Essential',
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier as keyof typeof names] || tier;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
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

  const getFeatureIcon = (isIncluded: boolean, limitValue?: number | null) => {
    if (!isIncluded) {
      return <X className="h-4 w-4 text-red-500" />;
    }

    if (limitValue === null) {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getFeatureDisplay = (feature: SubscriptionFeature) => {
    if (!feature.is_included) {
      return 'Not included';
    }

    if (feature.limit_value === null) {
      return 'Unlimited';
    }

    return feature.limit_value.toString();
  };

  const getAllFeatures = () => {
    const allFeatures = new Set<string>();
    Object.values(features).forEach(tierFeatures => {
      tierFeatures.forEach(feature => {
        allFeatures.add(feature.feature_name);
      });
    });
    return Array.from(allFeatures);
  };

  const getFeatureForTier = (tier: string, featureName: string) => {
    return features[tier]?.find(f => f.feature_name === featureName);
  };

  const isCurrentTier = (tier: string) => {
    return currentSubscription?.tier === tier;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const allFeatures = getAllFeatures();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Feature Comparison</h2>
        <p className="text-muted-foreground">
          Compare features across all subscription tiers
        </p>
      </div>

      {/* Feature Comparison Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Features</th>
                  {tiers.map(tier => (
                    <th key={tier.id} className="text-center p-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          {getTierIcon(tier.id)}
                          <span className="font-medium">{tier.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${tier.price}/month
                        </div>
                        {isCurrentTier(tier.id) && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map(featureName => (
                  <tr key={featureName} className="border-b">
                    <td className="p-4 font-medium">{featureName}</td>
                    {tiers.map(tier => {
                      const feature = getFeatureForTier(tier.id, featureName);
                      return (
                        <td key={tier.id} className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getFeatureIcon(
                              feature?.is_included || false,
                              feature?.limit_value
                            )}
                            <span className="text-sm text-muted-foreground">
                              {feature
                                ? getFeatureDisplay(feature)
                                : 'Not available'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feature Descriptions */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map(tier => {
          const tierFeatures = features[tier.id] || [];
          const isCurrent = isCurrentTier(tier.id);

          return (
            <Card
              key={tier.id}
              className={`${getTierColor(tier.id)} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTierIcon(tier.id)}
                  {tier.name}
                  {isCurrent && <Badge variant="default">Current</Badge>}
                </CardTitle>
                <CardDescription>
                  {tier.id === 'essential' &&
                    'Free forever with basic features'}
                  {tier.id === 'showcase' && 'Perfect for growing businesses'}
                  {tier.id === 'spotlight' && 'Maximum visibility and features'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2">
                  {tierFeatures.slice(0, 8).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {getFeatureIcon(feature.is_included, feature.limit_value)}
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {feature.feature_name}
                        </span>
                        {feature.feature_description && (
                          <div className="text-xs text-muted-foreground">
                            {feature.feature_description}
                          </div>
                        )}
                        {feature.limit_value && (
                          <div className="text-xs text-muted-foreground">
                            Limit: {feature.limit_value}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                  {tierFeatures.length > 8 && (
                    <li className="text-sm text-muted-foreground">
                      +{tierFeatures.length - 8} more features
                    </li>
                  )}
                </ul>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full">Choose {tier.name}</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Categories</CardTitle>
          <CardDescription>
            Detailed breakdown of features by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Profile Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Basic profile (Essential)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Enhanced profile (Showcase+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Premium profile (Spotlight)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Visibility Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Basic search visibility (Essential)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority visibility (Showcase+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Top visibility (Spotlight)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
