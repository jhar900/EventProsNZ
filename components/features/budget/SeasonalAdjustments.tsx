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
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  DollarSign,
  Clock,
} from 'lucide-react';

interface SeasonalAdjustment {
  service_type: string;
  base_pricing: {
    price_min: number;
    price_max: number;
    price_average: number;
    seasonal_multiplier: number;
  };
  seasonal_adjustment: {
    season_type: string;
    seasonal_multiplier: number;
    special_date_multiplier: number;
    special_date_reason: string;
    final_multiplier: number;
  };
  adjusted_prices: {
    price_min: number;
    price_max: number;
    price_average: number;
  };
  savings_opportunity: {
    is_peak_season: boolean;
    is_off_peak_season: boolean;
    potential_savings: number;
    recommendation: string;
  };
}

interface SeasonalAdjustmentsProps {
  serviceType: string;
  eventDate: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
}

export function SeasonalAdjustments({
  serviceType,
  eventDate,
  location,
}: SeasonalAdjustmentsProps) {
  const [seasonalData, setSeasonalData] = useState<SeasonalAdjustment | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceType && eventDate) {
      loadSeasonalData();
    }
  }, [serviceType, eventDate, location]);

  const loadSeasonalData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        service_type: serviceType,
        event_date: eventDate,
      });

      if (location) {
        params.append('location', JSON.stringify(location));
      }

      const response = await fetch(`/api/budget/seasonal?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load seasonal data');
      }

      const data = await response.json();
      setSeasonalData(data.pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeasonColor = (seasonType: string) => {
    switch (seasonType) {
      case 'peak':
        return 'text-red-600';
      case 'off_peak':
        return 'text-green-600';
      case 'shoulder':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSeasonLabel = (seasonType: string) => {
    switch (seasonType) {
      case 'peak':
        return 'Peak Season';
      case 'off_peak':
        return 'Off-Peak Season';
      case 'shoulder':
        return 'Shoulder Season';
      default:
        return 'Standard Season';
    }
  };

  const getSeasonIcon = (seasonType: string) => {
    switch (seasonType) {
      case 'peak':
        return <TrendingUp className="h-4 w-4" />;
      case 'off_peak':
        return <TrendingDown className="h-4 w-4" />;
      case 'shoulder':
        return <Calendar className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading seasonal adjustments...</span>
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

  if (!seasonalData) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No seasonal data available for this service type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seasonal Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Pricing Adjustments
          </CardTitle>
          <CardDescription>
            Pricing adjustments based on seasonal demand and special dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getSeasonColor(seasonalData.seasonal_adjustment.season_type)}`}
              >
                {getSeasonLabel(seasonalData.seasonal_adjustment.season_type)}
              </div>
              <div className="text-sm text-muted-foreground">
                Current Season
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getMultiplierColor(seasonalData.seasonal_adjustment.final_multiplier)}`}
              >
                {seasonalData.seasonal_adjustment.final_multiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-muted-foreground">
                Price Multiplier
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${seasonalData.adjusted_prices.price_average.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Adjusted Average
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Type Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Season Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSeasonIcon(seasonalData.seasonal_adjustment.season_type)}
              <span className="font-medium">Season Type</span>
            </div>
            <Badge
              variant="outline"
              className={`${getSeasonColor(seasonalData.seasonal_adjustment.season_type)} border-current`}
            >
              {getSeasonLabel(seasonalData.seasonal_adjustment.season_type)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Seasonal Multiplier
              </span>
              <div className="flex items-center gap-2">
                {getMultiplierIcon(
                  seasonalData.seasonal_adjustment.seasonal_multiplier
                )}
                <span
                  className={`font-medium ${getMultiplierColor(seasonalData.seasonal_adjustment.seasonal_multiplier)}`}
                >
                  {seasonalData.seasonal_adjustment.seasonal_multiplier.toFixed(
                    2
                  )}
                  x
                </span>
              </div>
            </div>
            <Progress
              value={seasonalData.seasonal_adjustment.seasonal_multiplier * 50}
              className="h-2"
            />
          </div>

          {seasonalData.seasonal_adjustment.special_date_reason !==
            'Standard pricing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Special Date Adjustment
                </span>
                <div className="flex items-center gap-2">
                  {getMultiplierIcon(
                    seasonalData.seasonal_adjustment.special_date_multiplier
                  )}
                  <span
                    className={`font-medium ${getMultiplierColor(seasonalData.seasonal_adjustment.special_date_multiplier)}`}
                  >
                    {seasonalData.seasonal_adjustment.special_date_multiplier.toFixed(
                      2
                    )}
                    x
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {seasonalData.seasonal_adjustment.special_date_reason}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
          <CardDescription>
            Base pricing vs. seasonally adjusted pricing
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
                    ${seasonalData.base_pricing.price_min.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average:</span>
                  <span>
                    ${seasonalData.base_pricing.price_average.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum:</span>
                  <span>
                    ${seasonalData.base_pricing.price_max.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Seasonally Adjusted</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Minimum:</span>
                  <span>
                    ${seasonalData.adjusted_prices.price_min.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average:</span>
                  <span>
                    $
                    {seasonalData.adjusted_prices.price_average.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum:</span>
                  <span>
                    ${seasonalData.adjusted_prices.price_max.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Price Impact</span>
              <div className="flex items-center gap-2">
                {seasonalData.adjusted_prices.price_average >
                seasonalData.base_pricing.price_average ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    seasonalData.adjusted_prices.price_average >
                    seasonalData.base_pricing.price_average
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {seasonalData.adjusted_prices.price_average >
                  seasonalData.base_pricing.price_average
                    ? '+'
                    : ''}
                  $
                  {(
                    seasonalData.adjusted_prices.price_average -
                    seasonalData.base_pricing.price_average
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Opportunity */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {seasonalData.savings_opportunity.potential_savings > 0
                    ? '$'
                    : ''}
                  {seasonalData.savings_opportunity.potential_savings.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Potential Savings
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {seasonalData.savings_opportunity.is_off_peak_season
                    ? 'Yes'
                    : 'No'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Off-Peak Season
                </div>
              </div>
            </div>

            <Alert
              className={
                seasonalData.savings_opportunity.is_off_peak_season
                  ? 'border-green-200 bg-green-50'
                  : 'border-blue-200 bg-blue-50'
              }
            >
              {seasonalData.savings_opportunity.is_off_peak_season ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Info className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription>
                {seasonalData.savings_opportunity.recommendation}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Event Date Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event Date Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Event Date</span>
              <span className="font-medium">{formatDate(eventDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Season Type</span>
              <Badge
                variant="outline"
                className={`${getSeasonColor(seasonalData.seasonal_adjustment.season_type)} border-current`}
              >
                {getSeasonLabel(seasonalData.seasonal_adjustment.season_type)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Special Date
              </span>
              <span className="text-sm">
                {seasonalData.seasonal_adjustment.special_date_reason}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadSeasonalData} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh Seasonal Data
        </Button>
      </div>
    </div>
  );
}
