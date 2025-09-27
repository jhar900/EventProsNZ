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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Crown, Star, Zap, DollarSign } from 'lucide-react';

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

interface PricingInfo {
  tier: string;
  billing_cycle: string;
  base_price: number;
  discount_applied: number;
  final_price: number;
  savings: number;
}

interface PricingDisplayProps {
  tiers: SubscriptionTierInfo[];
  currentSubscription?: Subscription | null;
}

export function PricingDisplay({
  tiers,
  currentSubscription,
}: PricingDisplayProps) {
  const [pricing, setPricing] = useState<Record<string, PricingInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<
    'monthly' | 'yearly' | '2year'
  >('monthly');

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/pricing');
      if (!response.ok) {
        throw new Error('Failed to load pricing data');
      }

      const data = await response.json();

      // Group pricing by tier
      const pricingByTier =
        data.pricing?.reduce((acc: Record<string, any[]>, price: any) => {
          if (!acc[price.tier]) {
            acc[price.tier] = [];
          }
          acc[price.tier].push(price);
          return acc;
        }, {}) || {};

      setPricing(pricingByTier);
    } catch (err) {
      setError('Failed to load pricing data');
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

  const getBillingCycleDisplay = (cycle: string) => {
    const cycles = {
      monthly: 'Monthly',
      yearly: 'Yearly',
      '2year': '2-Year',
    };
    return cycles[cycle as keyof typeof cycles] || cycle;
  };

  const getSavingsPercentage = (tier: string, cycle: string) => {
    if (cycle === 'monthly') return 0;

    const monthlyPrice = getMonthlyPrice(tier);
    const cyclePrice = getCyclePrice(tier, cycle);
    const monthsInCycle = cycle === 'yearly' ? 12 : 24;

    const totalMonthly = monthlyPrice * monthsInCycle;
    const savings = totalMonthly - cyclePrice;
    return Math.round((savings / totalMonthly) * 100);
  };

  const getMonthlyPrice = (tier: string) => {
    const prices = {
      essential: 0,
      showcase: 29,
      spotlight: 69,
    };
    return prices[tier as keyof typeof prices] || 0;
  };

  const getCyclePrice = (tier: string, cycle: string) => {
    const prices = {
      essential: { monthly: 0, yearly: 0, '2year': 0 },
      showcase: { monthly: 29, yearly: 299, '2year': 499 },
      spotlight: { monthly: 69, yearly: 699, '2year': 1199 },
    };
    return (
      prices[tier as keyof typeof prices]?.[
        cycle as keyof (typeof prices)['essential']
      ] || 0
    );
  };

  const getTierPricing = (tier: string) => {
    return pricing[tier] || [];
  };

  const getCurrentCyclePricing = (tier: string) => {
    const tierPricing = getTierPricing(tier);
    return tierPricing.find(p => p.billing_cycle === selectedCycle);
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Pricing Plans</h2>
        <p className="text-muted-foreground">
          Choose the billing cycle that works best for you
        </p>
      </div>

      <Tabs
        value={selectedCycle}
        onValueChange={value => setSelectedCycle(value as any)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="2year">2-Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCycle} className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map(tier => {
              const tierPricing = getCurrentCyclePricing(tier.id);
              const savingsPercentage = getSavingsPercentage(
                tier.id,
                selectedCycle
              );
              const isCurrentTier = currentSubscription?.tier === tier.id;

              return (
                <Card
                  key={tier.id}
                  className={`relative ${
                    isCurrentTier ? 'ring-2 ring-primary' : ''
                  } ${getTierColor(tier.id)}`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default">Current Plan</Badge>
                    </div>
                  )}

                  {savingsPercentage > 0 && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="destructive">
                        Save {savingsPercentage}%
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {getTierIcon(tier.id)}
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.id === 'essential' && 'Free forever'}
                      {tier.id === 'showcase' &&
                        'Perfect for growing businesses'}
                      {tier.id === 'spotlight' &&
                        'Maximum visibility and features'}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${tierPricing?.price || 0}
                      </span>
                      <span className="text-muted-foreground">
                        /{getBillingCycleDisplay(selectedCycle).toLowerCase()}
                      </span>
                    </div>
                    {savingsPercentage > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Save $
                        {getMonthlyPrice(tier.id) *
                          (selectedCycle === 'yearly' ? 12 : 24) -
                          (tierPricing?.price || 0)}{' '}
                        per {selectedCycle === 'yearly' ? 'year' : '2 years'}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Monthly equivalent</span>
                        <span className="font-medium">
                          $
                          {(
                            (tierPricing?.price || 0) /
                            (selectedCycle === 'yearly'
                              ? 12
                              : selectedCycle === '2year'
                                ? 24
                                : 1)
                          ).toFixed(2)}
                        </span>
                      </div>
                      {savingsPercentage > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">
                            You save
                          </span>
                          <span className="font-medium text-green-600">
                            $
                            {getMonthlyPrice(tier.id) *
                              (selectedCycle === 'yearly' ? 12 : 24) -
                              (tierPricing?.price || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4">
                      {isCurrentTier ? (
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
        </TabsContent>
      </Tabs>

      {/* Pricing Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Comparison
          </CardTitle>
          <CardDescription>
            Compare pricing across all billing cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plan</th>
                  <th className="text-center p-2">Monthly</th>
                  <th className="text-center p-2">Yearly</th>
                  <th className="text-center p-2">2-Year</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(tier => {
                  const monthlyPrice =
                    getTierPricing(tier.id).find(
                      p => p.billing_cycle === 'monthly'
                    )?.price || 0;
                  const yearlyPrice =
                    getTierPricing(tier.id).find(
                      p => p.billing_cycle === 'yearly'
                    )?.price || 0;
                  const twoYearPrice =
                    getTierPricing(tier.id).find(
                      p => p.billing_cycle === '2year'
                    )?.price || 0;

                  return (
                    <tr key={tier.id} className="border-b">
                      <td className="p-2 font-medium">{tier.name}</td>
                      <td className="p-2 text-center">${monthlyPrice}</td>
                      <td className="p-2 text-center">
                        ${yearlyPrice}
                        {yearlyPrice > 0 && (
                          <div className="text-xs text-green-600">
                            Save ${monthlyPrice * 12 - yearlyPrice}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        ${twoYearPrice}
                        {twoYearPrice > 0 && (
                          <div className="text-xs text-green-600">
                            Save ${monthlyPrice * 24 - twoYearPrice}
                          </div>
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
    </div>
  );
}
