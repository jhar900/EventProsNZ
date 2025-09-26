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
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react';

interface PricingData {
  service_type: string;
  base_pricing: {
    price_min: number;
    price_max: number;
    price_average: number;
    data_source: string;
    created_at: string;
  };
  adjusted_pricing: {
    price_min: number;
    price_max: number;
    price_average: number;
  };
  real_time_pricing?: {
    min: number;
    max: number;
    average: number;
    source: string;
    contractor_count: number;
  };
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
  seasonal_applied: boolean;
  data_freshness: string;
  confidence_score: number;
}

interface PricingDataDisplayProps {
  serviceType: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
}

export function PricingDataDisplay({
  serviceType,
  location,
}: PricingDataDisplayProps) {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceType) {
      loadPricingData();
    }
  }, [serviceType, location]);

  const loadPricingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        service_type: serviceType,
        seasonal: 'true',
      });

      if (location) {
        params.append('location', JSON.stringify(location));
      }

      const response = await fetch(`/api/budget/pricing?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load pricing data');
      }

      const data = await response.json();
      setPricingData(data.pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceRangeColor = (min: number, max: number, average: number) => {
    const range = max - min;
    const variance = range / average;

    if (variance > 0.5) return 'text-red-600';
    if (variance > 0.3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPriceRangeLabel = (min: number, max: number, average: number) => {
    const range = max - min;
    const variance = range / average;

    if (variance > 0.5) return 'High Price Variance';
    if (variance > 0.3) return 'Moderate Price Variance';
    return 'Low Price Variance';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading pricing data...</span>
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

  if (!pricingData) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No pricing data available for this service type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pricing Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Data for{' '}
            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
          </CardTitle>
          <CardDescription>
            Real-time and historical pricing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${pricingData.adjusted_pricing.price_average.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Average Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${pricingData.adjusted_pricing.price_min.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Minimum Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ${pricingData.adjusted_pricing.price_max.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Maximum Price</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality & Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Data Confidence
                </span>
                <Badge
                  variant="outline"
                  className={`${getConfidenceColor(pricingData.confidence_score)} border-current`}
                >
                  {getConfidenceLabel(pricingData.confidence_score)}
                </Badge>
              </div>
              <Progress
                value={pricingData.confidence_score * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Price Variance
                </span>
                <Badge
                  variant="outline"
                  className={`${getPriceRangeColor(
                    pricingData.adjusted_pricing.price_min,
                    pricingData.adjusted_pricing.price_max,
                    pricingData.adjusted_pricing.price_average
                  )} border-current`}
                >
                  {getPriceRangeLabel(
                    pricingData.adjusted_pricing.price_min,
                    pricingData.adjusted_pricing.price_max,
                    pricingData.adjusted_pricing.price_average
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Data Freshness</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(pricingData.data_freshness)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Location Applied</div>
                <div className="text-xs text-muted-foreground">
                  {pricingData.location ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Seasonal Applied</div>
                <div className="text-xs text-muted-foreground">
                  {pricingData.seasonal_applied ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base vs Adjusted Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Comparison</CardTitle>
          <CardDescription>
            Base pricing vs. adjusted pricing with location and seasonal factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Base Pricing</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Minimum:</span>
                    <span>
                      ${pricingData.base_pricing.price_min.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average:</span>
                    <span>
                      ${pricingData.base_pricing.price_average.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Maximum:</span>
                    <span>
                      ${pricingData.base_pricing.price_max.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Adjusted Pricing</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Minimum:</span>
                    <span>
                      ${pricingData.adjusted_pricing.price_min.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average:</span>
                    <span>
                      $
                      {pricingData.adjusted_pricing.price_average.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Maximum:</span>
                    <span>
                      ${pricingData.adjusted_pricing.price_max.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price Adjustment</span>
                <div className="flex items-center gap-2">
                  {pricingData.adjusted_pricing.price_average >
                  pricingData.base_pricing.price_average ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      pricingData.adjusted_pricing.price_average >
                      pricingData.base_pricing.price_average
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {pricingData.adjusted_pricing.price_average >
                    pricingData.base_pricing.price_average
                      ? '+'
                      : ''}
                    $
                    {(
                      pricingData.adjusted_pricing.price_average -
                      pricingData.base_pricing.price_average
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Pricing */}
      {pricingData.real_time_pricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Real-time Pricing
            </CardTitle>
            <CardDescription>
              Live pricing data from active contractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${pricingData.real_time_pricing.average.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Price
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${pricingData.real_time_pricing.min.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Minimum Price
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  ${pricingData.real_time_pricing.max.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Maximum Price
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {pricingData.real_time_pricing.contractor_count} Active
                Contractors
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadPricingData} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh Pricing Data
        </Button>
      </div>
    </div>
  );
}
