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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Crown, Star, Zap } from 'lucide-react';
import { PricingCalculator } from './PricingCalculator';

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

interface SubscriptionTiersProps {
  tiers: SubscriptionTierInfo[];
  currentSubscription?: Subscription | null;
  onSubscriptionChange: () => void;
}

export function SubscriptionTiers({
  tiers,
  currentSubscription,
  onSubscriptionChange,
}: SubscriptionTiersProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);

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

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'essential':
        return 'secondary';
      case 'showcase':
        return 'default';
      case 'spotlight':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleSelectTier = async (tier: SubscriptionTierInfo) => {
    if (currentSubscription?.tier === tier.id) {
      return;
    }

    setLoading(tier.id);
    setError(null);

    try {
      if (tier.id === 'essential') {
        // Essential is free, no need to create subscription
        setError('Essential tier is free and already available');
        return;
      }

      // Start trial for paid tiers
      const response = await fetch('/api/subscriptions/trial/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trial');
      }

      onSubscriptionChange();
      setSelectedTier(tier.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTierInfo) => {
    setLoading(tier.id);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier.id,
          billing_cycle: 'monthly',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to subscribe');
      }

      onSubscriptionChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(null);
    }
  };

  const isCurrentTier = (tier: SubscriptionTierInfo) => {
    return currentSubscription?.tier === tier.id;
  };

  const canUpgrade = (tier: SubscriptionTierInfo) => {
    if (!currentSubscription) return true;
    if (currentSubscription.status === 'trial') return true;

    const tierOrder = ['essential', 'showcase', 'spotlight'];
    const currentIndex = tierOrder.indexOf(currentSubscription.tier);
    const targetIndex = tierOrder.indexOf(tier.id);

    return targetIndex > currentIndex;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your needs
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map(tier => (
          <Card
            key={tier.id}
            className={`relative ${
              isCurrentTier(tier)
                ? 'ring-2 ring-primary'
                : canUpgrade(tier)
                  ? 'hover:shadow-lg transition-shadow'
                  : 'opacity-75'
            } ${getTierColor(tier.id)}`}
          >
            {isCurrentTier(tier) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getTierIcon(tier.id)}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>
                {tier.id === 'essential' && 'Free forever'}
                {tier.id === 'showcase' && 'Perfect for growing businesses'}
                {tier.id === 'spotlight' && 'Maximum visibility and features'}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {tier.features.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    +{tier.features.length - 5} more features
                  </li>
                )}
              </ul>

              <div className="pt-4">
                {isCurrentTier(tier) ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : tier.id === 'essential' ? (
                  <Button className="w-full" variant="outline" disabled>
                    Free Forever
                  </Button>
                ) : canUpgrade(tier) ? (
                  <div className="space-y-2">
                    {tier.is_trial_eligible && !currentSubscription && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleSelectTier(tier)}
                        disabled={loading === tier.id}
                      >
                        {loading === tier.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Start Free Trial'
                        )}
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(tier)}
                      disabled={loading === tier.id}
                    >
                      {loading === tier.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Subscribe Now'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Downgrade Not Available
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowPricingCalculator(!showPricingCalculator)}
        >
          {showPricingCalculator ? 'Hide' : 'Show'} Pricing Calculator
        </Button>
      </div>

      {showPricingCalculator && (
        <PricingCalculator
          tiers={tiers}
          currentSubscription={currentSubscription}
        />
      )}
    </div>
  );
}
