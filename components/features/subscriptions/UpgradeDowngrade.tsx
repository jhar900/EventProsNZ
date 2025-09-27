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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowUp,
  ArrowDown,
  Crown,
  Star,
  Zap,
  DollarSign,
} from 'lucide-react';

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

interface ProrationInfo {
  current_cycle_remaining: number;
  proration_amount: number;
  new_cycle_amount: number;
  effective_date: string;
}

interface UpgradeDowngradeProps {
  currentSubscription?: Subscription | null;
  tiers: SubscriptionTierInfo[];
  onSubscriptionChange: () => void;
}

export function UpgradeDowngrade({
  currentSubscription,
  tiers,
  onSubscriptionChange,
}: UpgradeDowngradeProps) {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proration, setProration] = useState<ProrationInfo | null>(null);
  const [actionType, setActionType] = useState<'upgrade' | 'downgrade' | null>(
    null
  );

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

  const getTierPrice = (tier: string) => {
    const tierInfo = tiers.find(t => t.id === tier);
    return tierInfo?.price || 0;
  };

  const canUpgrade = (targetTier: string) => {
    if (!currentSubscription) return false;

    const tierOrder = ['essential', 'showcase', 'spotlight'];
    const currentIndex = tierOrder.indexOf(currentSubscription.tier);
    const targetIndex = tierOrder.indexOf(targetTier);

    return targetIndex > currentIndex;
  };

  const canDowngrade = (targetTier: string) => {
    if (!currentSubscription) return false;

    const tierOrder = ['essential', 'showcase', 'spotlight'];
    const currentIndex = tierOrder.indexOf(currentSubscription.tier);
    const targetIndex = tierOrder.indexOf(targetTier);

    return targetIndex < currentIndex;
  };

  const handleTierChange = (tier: string) => {
    setSelectedTier(tier);
    setError(null);
    setProration(null);
    setActionType(null);

    if (!currentSubscription) return;

    if (canUpgrade(tier)) {
      setActionType('upgrade');
    } else if (canDowngrade(tier)) {
      setActionType('downgrade');
    }
  };

  const calculateProration = async () => {
    if (!selectedTier || !currentSubscription) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/${currentSubscription.id}/${actionType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            new_tier: selectedTier,
            effective_date: effectiveDate || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to calculate ${actionType}`);
      }

      const data = await response.json();
      setProration(data.proration);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to calculate ${actionType}`
      );
    } finally {
      setLoading(false);
    }
  };

  const executeChange = async () => {
    if (!selectedTier || !currentSubscription || !actionType) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/${currentSubscription.id}/${actionType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            new_tier: selectedTier,
            effective_date: effectiveDate || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${actionType} subscription`
        );
      }

      onSubscriptionChange();
      setSelectedTier('');
      setEffectiveDate('');
      setProration(null);
      setActionType(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${actionType} subscription`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!currentSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You need an active subscription to upgrade or downgrade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>View Available Plans</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Upgrade or Downgrade</h2>
        <p className="text-muted-foreground">Change your subscription plan</p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTierIcon(currentSubscription.tier)}
            Current Subscription
          </CardTitle>
          <CardDescription>Your current plan details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-medium">Plan</span>
            <Badge variant="outline">
              {getTierDisplayName(currentSubscription.tier)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Price</span>
            <span className="text-lg font-semibold">
              ${currentSubscription.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Billing Cycle</span>
            <span className="capitalize">
              {currentSubscription.billing_cycle}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select New Plan</CardTitle>
          <CardDescription>
            Choose the plan you want to change to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTier} onValueChange={handleTierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {tiers.map(tier => {
                const isCurrentTier = currentSubscription.tier === tier.id;
                const canUpgradeTo = canUpgrade(tier.id);
                const canDowngradeTo = canDowngrade(tier.id);

                return (
                  <SelectItem
                    key={tier.id}
                    value={tier.id}
                    disabled={isCurrentTier}
                  >
                    <div className="flex items-center gap-2">
                      {getTierIcon(tier.id)}
                      <span>{tier.name}</span>
                      <span className="text-muted-foreground">
                        ${tier.price}/month
                      </span>
                      {isCurrentTier && (
                        <Badge variant="secondary" className="ml-2">
                          Current
                        </Badge>
                      )}
                      {canUpgradeTo && (
                        <Badge variant="default" className="ml-2">
                          Upgrade
                        </Badge>
                      )}
                      {canDowngradeTo && (
                        <Badge variant="outline" className="ml-2">
                          Downgrade
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedTier && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {actionType === 'upgrade' && (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium">Upgrade</span>
                  </>
                )}
                {actionType === 'downgrade' && (
                  <>
                    <ArrowDown className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-500 font-medium">
                      Downgrade
                    </span>
                  </>
                )}
                <span>to {getTierDisplayName(selectedTier)}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">New Price</label>
                  <div className="mt-1 p-2 border rounded-md bg-muted">
                    ${getTierPrice(selectedTier).toFixed(2)}/month
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={calculateProration}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Calculate Proration'
                  )}
                </Button>
                <Button
                  onClick={executeChange}
                  disabled={loading || !proration}
                  variant={actionType === 'upgrade' ? 'default' : 'destructive'}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Confirm ${actionType === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proration Details */}
      {proration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Proration Details
            </CardTitle>
            <CardDescription>
              Billing calculation for your plan change
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Cycle Remaining</span>
              <span>{proration.current_cycle_remaining} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Proration Amount</span>
              <span>${proration.proration_amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">New Cycle Amount</span>
              <span>${proration.new_cycle_amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Effective Date</span>
              <span>
                {new Date(proration.effective_date).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
