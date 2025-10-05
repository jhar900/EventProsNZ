'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Crown,
  Star,
  Zap,
  BarChart3,
  Headphones,
  Eye,
  Rocket,
} from 'lucide-react';
import { TierFeatures } from './TierFeatures';
import { SpotlightFeatures } from './SpotlightFeatures';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { PrioritySupport } from './PrioritySupport';
import { EarlyAccess } from './EarlyAccess';
import { CustomProfileURL } from './CustomProfileURL';
import { ContractorSpotlight } from './ContractorSpotlight';

interface PremiumFeatureAccessProps {
  userId?: string;
}

interface FeatureAccess {
  id: string;
  user_id: string;
  feature_name: string;
  tier_required: string;
  is_accessible: boolean;
  access_granted_at: string;
  access_expires_at?: string;
}

interface TierFeature {
  id: string;
  tier: string;
  feature_name: string;
  feature_description: string;
  is_included: boolean;
  limit_value?: number;
}

interface UserSubscription {
  tier: string;
  status: string;
}

export function PremiumFeatureAccess({ userId }: PremiumFeatureAccessProps) {
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess[]>([]);
  const [tierFeatures, setTierFeatures] = useState<TierFeature[]>([]);
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeatureAccess();
  }, [userId]);

  const loadFeatureAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/features/access?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load feature access');
      }

      const data = await response.json();
      setFeatureAccess(data.features || []);
      setTierFeatures(data.tierFeatures || []);
      setUserSubscription({ tier: data.tier, status: 'active' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'essential':
        return <Crown className="h-5 w-5 text-gray-500" />;
      case 'showcase':
        return <Star className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Crown className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'essential':
        return 'bg-gray-100 text-gray-800';
      case 'showcase':
        return 'bg-blue-100 text-blue-800';
      case 'spotlight':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'essential':
        return 'Essential';
      case 'showcase':
        return 'Showcase';
      case 'spotlight':
        return 'Spotlight';
      default:
        return 'Essential';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading premium features...</span>
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
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          {getTierIcon(userSubscription?.tier || 'essential')}
          <h1 className="text-3xl font-bold">Premium Features</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to grow your business and stand out from the
          competition.
        </p>
        <Badge className={getTierColor(userSubscription?.tier || 'essential')}>
          {getTierName(userSubscription?.tier || 'essential')} Plan
        </Badge>
      </div>

      {/* Feature Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center space-x-2">
            <Headphones className="h-4 w-4" />
            <span>Support</span>
          </TabsTrigger>
          <TabsTrigger
            value="spotlight"
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Spotlight</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TierFeatures
            tier={userSubscription?.tier || 'essential'}
            features={tierFeatures}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics userId={userId} />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <PrioritySupport userId={userId} />
        </TabsContent>

        <TabsContent value="spotlight" className="space-y-6">
          <div className="grid gap-6">
            <SpotlightFeatures userId={userId} />
            <CustomProfileURL userId={userId} />
            <ContractorSpotlight userId={userId} />
            <EarlyAccess userId={userId} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Access Status */}
      {featureAccess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Feature Access</CardTitle>
            <CardDescription>
              Features you currently have access to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureAccess.map(feature => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{feature.feature_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getTierName(feature.tier_required)} tier
                    </p>
                  </div>
                  <Badge
                    variant={feature.is_accessible ? 'default' : 'secondary'}
                    className={
                      feature.is_accessible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {feature.is_accessible ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
