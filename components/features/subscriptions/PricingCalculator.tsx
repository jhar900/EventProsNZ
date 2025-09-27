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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, Check, X } from 'lucide-react';

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

interface PricingCalculatorProps {
  tiers: SubscriptionTierInfo[];
  currentSubscription?: Subscription | null;
}

export function PricingCalculator({
  tiers,
  currentSubscription,
}: PricingCalculatorProps) {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState<string>('monthly');
  const [promotionalCode, setPromotionalCode] = useState<string>('');
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);

  const getTierDisplayName = (tier: string) => {
    const names = {
      essential: 'Essential',
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier as keyof typeof names] || tier;
  };

  const getBillingCycleDisplay = (cycle: string) => {
    const cycles = {
      monthly: 'Monthly',
      yearly: 'Yearly',
      '2year': '2-Year',
    };
    return cycles[cycle as keyof typeof cycles] || cycle;
  };

  const calculatePricing = async () => {
    if (!selectedTier || !selectedCycle) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          billing_cycle: selectedCycle,
          promotional_code: promotionalCode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate pricing');
      }

      const data = await response.json();
      setPricing({
        tier: selectedTier,
        billing_cycle: selectedCycle,
        base_price: data.total_price,
        discount_applied: data.discount_applied,
        final_price: data.final_price,
        savings: data.savings,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to calculate pricing'
      );
    } finally {
      setLoading(false);
    }
  };

  const validatePromotionalCode = async () => {
    if (!promotionalCode || !selectedTier) return;

    try {
      const response = await fetch('/api/subscriptions/promotional/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promotionalCode,
          tier: selectedTier,
        }),
      });

      if (!response.ok) {
        setPromoValid(false);
        return;
      }

      const data = await response.json();
      setPromoValid(data.valid);
    } catch (err) {
      setPromoValid(false);
    }
  };

  const getSavingsPercentage = () => {
    if (!pricing) return 0;

    if (selectedCycle === 'monthly') return 0;

    const monthlyPrice = getMonthlyPrice(selectedTier);
    const cyclePrice = pricing.base_price;
    const monthsInCycle = selectedCycle === 'yearly' ? 12 : 24;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pricing Calculator
        </CardTitle>
        <CardDescription>
          Calculate the cost of your subscription with different billing cycles
          and promotional codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Tier</label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map(tier => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {getTierDisplayName(tier.id)} - ${tier.price}/month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Billing Cycle</label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="2year">2-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Promotional Code (Optional)
          </label>
          <div className="flex gap-2">
            <Input
              value={promotionalCode}
              onChange={e => setPromotionalCode(e.target.value)}
              placeholder="Enter promotional code"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={validatePromotionalCode}
              disabled={!promotionalCode || !selectedTier}
            >
              Validate
            </Button>
          </div>
          {promoValid !== null && (
            <div className="flex items-center gap-2 text-sm">
              {promoValid ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Valid promotional code</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Invalid promotional code</span>
                </>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={calculatePricing}
          disabled={!selectedTier || !selectedCycle || loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Calculate Pricing'
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pricing && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan</span>
                <span>{getTierDisplayName(pricing.tier)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Billing Cycle</span>
                <span>{getBillingCycleDisplay(pricing.billing_cycle)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Base Price</span>
                <span>${pricing.base_price.toFixed(2)}</span>
              </div>

              {pricing.discount_applied > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Discount Applied</span>
                  <span className="text-green-600">
                    -${pricing.discount_applied.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Final Price</span>
                <span className="text-lg font-semibold">
                  ${pricing.final_price.toFixed(2)}
                </span>
              </div>

              {pricing.savings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">You Save</span>
                  <span className="text-green-600 font-semibold">
                    ${pricing.savings.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Monthly Equivalent</span>
                <span>
                  $
                  {(
                    pricing.final_price /
                    (selectedCycle === 'yearly'
                      ? 12
                      : selectedCycle === '2year'
                        ? 24
                        : 1)
                  ).toFixed(2)}
                </span>
              </div>

              {getSavingsPercentage() > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Savings Percentage</span>
                  <Badge variant="secondary">
                    {getSavingsPercentage()}% off
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
