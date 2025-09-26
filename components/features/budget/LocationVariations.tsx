'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  DollarSign,
  Building,
  Home,
} from 'lucide-react';

interface LocationVariation {
  service_type: string;
  base_pricing: {
    price_min: number;
    price_max: number;
    price_average: number;
    location_multiplier: number;
  };
  location_adjustment: {
    cost_category: string;
    multiplier: number;
    base_multiplier: number;
    service_adjustment: number;
    factors: {
      location_type: string;
      service_type: string;
      city?: string;
      region?: string;
      coordinates: { lat: number; lng: number };
    };
  };
  adjusted_prices: {
    price_min: number;
    price_max: number;
    price_average: number;
  };
  cost_analysis: {
    is_high_cost_area: boolean;
    is_low_cost_area: boolean;
    cost_category: string;
    potential_savings: number;
    recommendation: string;
  };
}

interface LocationVariationsProps {
  serviceType: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
}

export function LocationVariations({
  serviceType,
  location,
}: LocationVariationsProps) {
  const [locationData, setLocationData] = useState<LocationVariation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceType && location) {
      loadLocationData();
    }
  }, [serviceType, location]);

  const loadLocationData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        service_type: serviceType,
        location: JSON.stringify(location),
      });

      const response = await fetch(`/api/budget/location?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load location data');
      }

      const data = await response.json();
      setLocationData(data.pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getCostCategoryColor = (category: string) => {
    switch (category) {
      case 'high_cost':
        return 'text-red-600';
      case 'moderate_high_cost':
        return 'text-orange-600';
      case 'moderate_cost':
        return 'text-blue-600';
      case 'low_cost':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCostCategoryLabel = (category: string) => {
    switch (category) {
      case 'high_cost':
        return 'High Cost Area';
      case 'moderate_high_cost':
        return 'Moderate-High Cost';
      case 'moderate_cost':
        return 'Moderate Cost';
      case 'low_cost':
        return 'Low Cost Area';
      default:
        return 'Standard Cost';
    }
  };

  const getCostCategoryIcon = (category: string) => {
    switch (category) {
      case 'high_cost':
        return <Building className="h-4 w-4" />;
      case 'moderate_high_cost':
        return <TrendingUp className="h-4 w-4" />;
      case 'moderate_cost':
        return <CheckCircle className="h-4 w-4" />;
      case 'low_cost':
        return <Home className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier > 1.2) return 'text-red-600';
    if (multiplier < 0.8) return 'text-green-600';
    return 'text-blue-600';
  };

  const getMultiplierIcon = (multiplier: number) => {
    if (multiplier > 1.2) return <TrendingUp className="h-4 w-4" />;
    if (multiplier < 0.8) return <TrendingDown className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading location data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!locationData) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No location data available. Please provide location information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Pricing Adjustments
          </CardTitle>
          <CardDescription>
            Pricing adjustments based on location and regional cost factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getCostCategoryColor(locationData.location_adjustment.cost_category)}`}
              >
                {getCostCategoryLabel(
                  locationData.location_adjustment.cost_category
                )}
              </div>
              <div className="text-sm text-muted-foreground">Cost Category</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getMultiplierColor(locationData.location_adjustment.multiplier)}`}
              >
                {locationData.location_adjustment.multiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-muted-foreground">
                Location Multiplier
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${locationData.adjusted_prices.price_average.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Adjusted Average
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Location Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCostCategoryIcon(
                locationData.location_adjustment.cost_category
              )}
              <span className="font-medium">Cost Category</span>
            </div>
            <Badge
              variant="outline"
              className={`${getCostCategoryColor(locationData.location_adjustment.cost_category)} border-current`}
            >
              {getCostCategoryLabel(
                locationData.location_adjustment.cost_category
              )}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Location Multiplier
              </span>
              <div className="flex items-center gap-2">
                {getMultiplierIcon(locationData.location_adjustment.multiplier)}
                <span
                  className={`font-medium ${getMultiplierColor(locationData.location_adjustment.multiplier)}`}
                >
                  {locationData.location_adjustment.multiplier.toFixed(2)}x
                </span>
              </div>
            </div>
            <Progress
              value={locationData.location_adjustment.multiplier * 50}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Service Adjustment
              </span>
              <div className="flex items-center gap-2">
                {getMultiplierIcon(
                  locationData.location_adjustment.service_adjustment
                )}
                <span
                  className={`font-medium ${getMultiplierColor(locationData.location_adjustment.service_adjustment)}`}
                >
                  {locationData.location_adjustment.service_adjustment.toFixed(
                    2
                  )}
                  x
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
          <CardDescription>
            Base pricing vs. location-adjusted pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Base Pricing</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Minimum:</span>
                  <span>
                    ${locationData.base_pricing.price_min.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average:</span>
                  <span>
                    ${locationData.base_pricing.price_average.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum:</span>
                  <span>
                    ${locationData.base_pricing.price_max.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Location Adjusted</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Minimum:</span>
                  <span>
                    ${locationData.adjusted_prices.price_min.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average:</span>
                  <span>
                    $
                    {locationData.adjusted_prices.price_average.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum:</span>
                  <span>
                    ${locationData.adjusted_prices.price_max.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Location Impact</span>
              <div className="flex items-center gap-2">
                {locationData.adjusted_prices.price_average >
                locationData.base_pricing.price_average ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    locationData.adjusted_prices.price_average >
                    locationData.base_pricing.price_average
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {locationData.adjusted_prices.price_average >
                  locationData.base_pricing.price_average
                    ? '+'
                    : ''}
                  $
                  {(
                    locationData.adjusted_prices.price_average -
                    locationData.base_pricing.price_average
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {locationData.cost_analysis.potential_savings > 0 ? '$' : ''}
                  {locationData.cost_analysis.potential_savings.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Potential Savings
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {locationData.cost_analysis.is_low_cost_area ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Low Cost Area
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {locationData.cost_analysis.is_high_cost_area ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-muted-foreground">
                  High Cost Area
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {locationData.location_adjustment.factors.city || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">City</div>
              </div>
            </div>

            <Alert
              className={
                locationData.cost_analysis.is_low_cost_area
                  ? 'border-green-200 bg-green-50'
                  : locationData.cost_analysis.is_high_cost_area
                    ? 'border-red-200 bg-red-50'
                    : 'border-blue-200 bg-blue-50'
              }
            >
              {locationData.cost_analysis.is_low_cost_area ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : locationData.cost_analysis.is_high_cost_area ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <Info className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription>
                {locationData.cost_analysis.recommendation}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">City</span>
              <span className="font-medium">
                {locationData.location_adjustment.factors.city ||
                  'Not specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Region</span>
              <span className="font-medium">
                {locationData.location_adjustment.factors.region ||
                  'Not specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coordinates</span>
              <span className="font-medium">
                {locationData.location_adjustment.factors.coordinates.lat.toFixed(
                  4
                )}
                ,{' '}
                {locationData.location_adjustment.factors.coordinates.lng.toFixed(
                  4
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Location Type
              </span>
              <Badge
                variant="outline"
                className={`${getCostCategoryColor(locationData.location_adjustment.factors.location_type)} border-current`}
              >
                {locationData.location_adjustment.factors.location_type.replace(
                  '_',
                  ' '
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadLocationData} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh Location Data
        </Button>
      </div>
    </div>
  );
}
