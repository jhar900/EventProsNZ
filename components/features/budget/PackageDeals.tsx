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
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Star,
  Clock,
  Users,
} from 'lucide-react';

interface PackageDeal {
  id: string;
  name: string;
  description: string;
  service_categories: string[];
  base_price: number;
  discount_percentage: number;
  final_price: number;
  savings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PackageDealsProps {
  packages: PackageDeal[];
  eventType: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
  onPackageApply?: (budget: any) => void;
}

export function PackageDeals({
  packages,
  eventType,
  location,
  onPackageApply,
}: PackageDealsProps) {
  const [availablePackages, setAvailablePackages] = useState<PackageDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingPackage, setApplyingPackage] = useState<string | null>(null);

  useEffect(() => {
    if (eventType) {
      loadPackageDeals();
    }
  }, [eventType, location]);

  const loadPackageDeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        event_type: eventType,
      });

      if (location) {
        params.append('location', JSON.stringify(location));
      }

      const response = await fetch(`/api/budget/packages?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load package deals');
      }

      const data = await response.json();
      setAvailablePackages(data.packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPackage = async (packageId: string) => {
    setApplyingPackage(packageId);

    try {
      const response = await fetch('/api/budget/packages/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: 'current-event', // This should be passed as a prop
          package_id: packageId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onPackageApply?.(data);
      }
    } catch (error) {
      console.error('Error applying package:', error);
    } finally {
      setApplyingPackage(null);
    }
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 1000) return 'text-green-600';
    if (savings > 500) return 'text-blue-600';
    return 'text-purple-600';
  };

  const getSavingsIcon = (savings: number) => {
    if (savings > 1000) return <TrendingDown className="h-4 w-4" />;
    if (savings > 500) return <DollarSign className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getDiscountColor = (discount: number) => {
    if (discount > 20) return 'bg-green-100 text-green-800';
    if (discount > 10) return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading package deals...</span>
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

  if (!availablePackages || availablePackages.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No package deals available for this event type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Deals
          </CardTitle>
          <CardDescription>
            Special package deals and discounts for your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {availablePackages.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Available Packages
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                $
                {availablePackages
                  .reduce((sum, pkg) => sum + pkg.savings, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Potential Savings
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  availablePackages.reduce(
                    (sum, pkg) => sum + pkg.discount_percentage,
                    0
                  ) / availablePackages.length
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Average Discount
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package List */}
      <div className="grid gap-4">
        {availablePackages.map(pkg => (
          <Card key={pkg.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDiscountColor(pkg.discount_percentage)}>
                    {pkg.discount_percentage}% OFF
                  </Badge>
                  <Badge variant="outline">
                    {pkg.service_categories.length} Services
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Package Description */}
              <div className="text-sm text-muted-foreground">
                {pkg.description}
              </div>

              {/* Service Categories */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Included Services:</div>
                <div className="flex flex-wrap gap-2">
                  {pkg.service_categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {category.charAt(0).toUpperCase() +
                        category.slice(1).replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pricing Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Base Price
                  </div>
                  <div className="text-xl font-bold text-gray-600 line-through">
                    ${pkg.base_price.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Final Price
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    ${pkg.final_price.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">You Save</div>
                  <div
                    className={`text-xl font-bold ${getSavingsColor(pkg.savings)}`}
                  >
                    ${pkg.savings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Savings Breakdown */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Savings Breakdown</span>
                  <div className="flex items-center gap-2">
                    {getSavingsIcon(pkg.savings)}
                    <span
                      className={`text-sm font-medium ${getSavingsColor(pkg.savings)}`}
                    >
                      {pkg.discount_percentage}% discount
                    </span>
                  </div>
                </div>
                <Progress
                  value={pkg.discount_percentage}
                  className="h-2 mt-2"
                />
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Package ID
                  </div>
                  <div className="text-sm font-mono">{pkg.id}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-sm">{formatDate(pkg.created_at)}</div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleApplyPackage(pkg.id)}
                  disabled={applyingPackage === pkg.id}
                  className="w-full md:w-auto"
                >
                  {applyingPackage === pkg.id ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  {applyingPackage === pkg.id ? 'Applying...' : 'Apply Package'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Package Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Best Value Packages</h4>
              <div className="space-y-1">
                {availablePackages
                  .sort((a, b) => b.savings - a.savings)
                  .slice(0, 3)
                  .map((pkg, index) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {pkg.name}
                      </span>
                      <span className="font-medium">
                        ${pkg.savings.toLocaleString()} saved
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Highest Discounts</h4>
              <div className="space-y-1">
                {availablePackages
                  .sort((a, b) => b.discount_percentage - a.discount_percentage)
                  .slice(0, 3)
                  .map((pkg, index) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {pkg.name}
                      </span>
                      <span className="font-medium">
                        {pkg.discount_percentage}% off
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadPackageDeals} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh Package Deals
        </Button>
      </div>
    </div>
  );
}
