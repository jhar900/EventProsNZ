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
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  Star,
} from 'lucide-react';
import { SubscriptionTiers } from './SubscriptionTiers';
import { PricingDisplay } from './PricingDisplay';
import { TrialManagement } from './TrialManagement';
import { UpgradeDowngrade } from './UpgradeDowngrade';
import { FeatureComparison } from './FeatureComparison';
import { BillingHistory } from './BillingHistory';

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

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
}

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current subscription
      const subscriptionResponse = await fetch('/api/subscriptions');
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.subscriptions[0] || null);
      }

      // Load subscription tiers
      const tiersResponse = await fetch('/api/subscriptions/tiers');
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers || []);
      }
    } catch (err) {
      setError('Failed to load subscription data');
      } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'trial':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'essential':
        return <Star className="h-4 w-4 text-gray-500" />;
      case 'showcase':
        return <Crown className="h-4 w-4 text-blue-500" />;
      case 'spotlight':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
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

  const getBillingCycleDisplay = (cycle: string) => {
    const cycles = {
      monthly: 'Monthly',
      yearly: 'Yearly',
      '2year': '2-Year',
    };
    return cycles[cycle as keyof typeof cycles] || cycle;
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
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription and access premium features
          </p>
        </div>
      </div>

      {subscription ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTierIcon(subscription.tier)}
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tier</span>
                <Badge variant="outline">
                  {getTierDisplayName(subscription.tier)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(subscription.status)}
                  <span className="capitalize">{subscription.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Billing Cycle</span>
                <span>
                  {getBillingCycleDisplay(subscription.billing_cycle)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Price</span>
                <span className="text-lg font-semibold">
                  ${subscription.price.toFixed(2)}
                </span>
              </div>
              {subscription.trial_end_date && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trial Ends</span>
                  <span>
                    {new Date(subscription.trial_end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.promotional_code && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Promotional Code</span>
                  <Badge variant="secondary">
                    {subscription.promotional_code}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                View Billing History
              </Button>
              <Button className="w-full" variant="outline">
                Update Payment Method
              </Button>
              <Button className="w-full" variant="outline">
                Download Invoice
              </Button>
              {subscription.status === 'active' && (
                <Button className="w-full" variant="destructive">
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don&apos;t have an active subscription. Choose a plan below to get
              started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>View Available Plans</Button>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management Tabs */}
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tiers">Plans</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="trial">Trial</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade/Downgrade</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4">
          <SubscriptionTiers
            tiers={tiers}
            currentSubscription={subscription}
            onSubscriptionChange={loadSubscriptionData}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingDisplay tiers={tiers} currentSubscription={subscription} />
        </TabsContent>

        <TabsContent value="trial" className="space-y-4">
          <TrialManagement
            currentSubscription={subscription}
            onTrialChange={loadSubscriptionData}
          />
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-4">
          <UpgradeDowngrade
            currentSubscription={subscription}
            tiers={tiers}
            onSubscriptionChange={loadSubscriptionData}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureComparison tiers={tiers} currentSubscription={subscription} />
        </TabsContent>
      </Tabs>

      {/* Billing History */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your past invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingHistory subscriptionId={subscription.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
