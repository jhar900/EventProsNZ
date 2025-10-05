'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Star, Zap } from 'lucide-react';

interface TierFeature {
  id: string;
  tier: string;
  feature_name: string;
  feature_description: string;
  is_included: boolean;
  limit_value?: number;
}

interface TierFeaturesProps {
  tier: string;
  features: TierFeature[];
}

export function TierFeatures({ tier, features }: TierFeaturesProps) {
  const getTierIcon = (tierName: string) => {
    switch (tierName) {
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

  const getTierColor = (tierName: string) => {
    switch (tierName) {
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

  const getTierName = (tierName: string) => {
    switch (tierName) {
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

  // Group features by category
  const groupedFeatures = features.reduce(
    (acc, feature) => {
      const category = feature.feature_name.split('_')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    },
    {} as Record<string, TierFeature[]>
  );

  const categoryNames: Record<string, string> = {
    basic: 'Basic Features',
    analytics: 'Analytics',
    support: 'Support',
    spotlight: 'Spotlight Features',
    custom: 'Custom Features',
    early: 'Early Access',
  };

  return (
    <div className="space-y-6">
      {/* Current Tier Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            {getTierIcon(tier)}
            <div>
              <CardTitle className="text-2xl">
                {getTierName(tier)} Plan
              </CardTitle>
              <CardDescription>
                Your current subscription tier and included features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={getTierColor(tier)}>{getTierName(tier)}</Badge>
            <span className="text-sm text-muted-foreground">
              {features.length} features included
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Features by Category */}
      <div className="grid gap-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">
                {categoryNames[category] ||
                  category.charAt(0).toUpperCase() + category.slice(1)}
              </CardTitle>
              <CardDescription>
                {categoryFeatures.length} features in this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryFeatures.map(feature => (
                  <div
                    key={feature.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {feature.is_included ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">
                          {feature.feature_name
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        {feature.limit_value && (
                          <Badge variant="outline" className="text-xs">
                            Limit: {feature.limit_value}
                          </Badge>
                        )}
                      </div>
                      {feature.feature_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.feature_description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Comparison</CardTitle>
          <CardDescription>
            Compare features across different subscription tiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Feature</th>
                  <th className="text-center p-4">
                    <div className="flex items-center justify-center space-x-2">
                      {getTierIcon('essential')}
                      <span className="text-sm font-medium">Essential</span>
                    </div>
                  </th>
                  <th className="text-center p-4">
                    <div className="flex items-center justify-center space-x-2">
                      {getTierIcon('showcase')}
                      <span className="text-sm font-medium">Showcase</span>
                    </div>
                  </th>
                  <th className="text-center p-4">
                    <div className="flex items-center justify-center space-x-2">
                      {getTierIcon('spotlight')}
                      <span className="text-sm font-medium">Spotlight</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.slice(0, 10).map(feature => (
                  <tr key={feature.id} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">
                        {feature.feature_name
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </td>
                    <td className="text-center p-4">
                      {feature.tier === 'essential' ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-4">
                      {['essential', 'showcase'].includes(feature.tier) ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-4">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
