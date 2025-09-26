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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { BudgetRecommendations } from './BudgetRecommendations';
import { BudgetAdjustment } from './BudgetAdjustment';
import { PricingDataDisplay } from './PricingDataDisplay';
import { SeasonalAdjustments } from './SeasonalAdjustments';
import { LocationVariations } from './LocationVariations';
import { PackageDeals } from './PackageDeals';
import { BudgetTracking } from './BudgetTracking';
import { CostSavingSuggestions } from './CostSavingSuggestions';
import { BudgetValidation } from './BudgetValidation';

interface BudgetPlanningProps {
  eventId?: string;
  eventType?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
  attendeeCount?: number;
  duration?: number;
  onBudgetUpdate?: (budget: BudgetPlan) => void;
}

interface BudgetPlan {
  totalBudget: number;
  serviceBreakdown: ServiceBreakdown[];
  recommendations: BudgetRecommendation[];
  packages: PackageDeal[];
  tracking: BudgetTracking[];
  adjustments: BudgetAdjustment[];
}

interface ServiceBreakdown {
  service_category: string;
  estimated_cost: number;
  actual_cost?: number;
  variance?: number;
  confidence_score?: number;
}

interface BudgetRecommendation {
  id: string;
  service_category: string;
  recommended_amount: number;
  confidence_score: number;
  pricing_source: string;
}

interface PackageDeal {
  id: string;
  name: string;
  description: string;
  service_categories: string[];
  base_price: number;
  discount_percentage: number;
  final_price: number;
  savings: number;
}

interface BudgetTracking {
  id: string;
  service_category: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  tracking_date: string;
}

interface BudgetAdjustment {
  service_category: string;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  reason: string;
}

export function BudgetPlanning({
  eventId,
  eventType,
  location,
  attendeeCount,
  duration,
  onBudgetUpdate,
}: BudgetPlanningProps) {
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [eventDetails, setEventDetails] = useState({
    eventType: eventType || '',
    location: location,
    attendeeCount: attendeeCount || 0,
    duration: duration || 0,
  });

  // Load budget recommendations on component mount
  useEffect(() => {
    if (eventDetails.eventType) {
      loadBudgetRecommendations();
    }
  }, [
    eventDetails.eventType,
    eventDetails.location,
    eventDetails.attendeeCount,
    eventDetails.duration,
  ]);

  const loadBudgetRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        event_type: eventDetails.eventType,
        attendee_count: eventDetails.attendeeCount.toString(),
        duration: eventDetails.duration.toString(),
      });

      if (eventDetails.location) {
        params.append('location', JSON.stringify(eventDetails.location));
      }

      const response = await fetch(`/api/budget/recommendations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load budget recommendations');
      }

      const data = await response.json();

      setBudgetPlan({
        totalBudget: data.total_budget,
        serviceBreakdown: [],
        recommendations: data.recommendations,
        packages: [],
        tracking: [],
        adjustments: [],
      });

      // Load additional data
      await Promise.all([
        loadServiceBreakdown(),
        loadPackageDeals(),
        loadBudgetTracking(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceBreakdown = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/budget/breakdown?event_id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setBudgetPlan(prev =>
          prev
            ? {
                ...prev,
                serviceBreakdown: data.breakdown,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Error loading service breakdown:', err);
    }
  };

  const loadPackageDeals = async () => {
    try {
      const params = new URLSearchParams({
        event_type: eventDetails.eventType,
      });

      if (eventDetails.location) {
        params.append('location', JSON.stringify(eventDetails.location));
      }

      const response = await fetch(`/api/budget/packages?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBudgetPlan(prev =>
          prev
            ? {
                ...prev,
                packages: data.packages,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Error loading package deals:', err);
    }
  };

  const loadBudgetTracking = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/budget/tracking?event_id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setBudgetPlan(prev =>
          prev
            ? {
                ...prev,
                tracking: data.tracking,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Error loading budget tracking:', err);
    }
  };

  const handleEventDetailsChange = (field: string, value: any) => {
    setEventDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBudgetUpdate = (updatedBudget: BudgetPlan) => {
    setBudgetPlan(updatedBudget);
    onBudgetUpdate?.(updatedBudget);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading budget recommendations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Details Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Planning
          </CardTitle>
          <CardDescription>
            Configure your event details to get personalized budget
            recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={eventDetails.eventType}
                onValueChange={value =>
                  handleEventDetailsChange('eventType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="birthday">Birthday Party</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="holiday">Holiday Party</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendeeCount">Attendee Count</Label>
              <Input
                id="attendeeCount"
                type="number"
                value={eventDetails.attendeeCount}
                onChange={e =>
                  handleEventDetailsChange(
                    'attendeeCount',
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="Number of guests"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={eventDetails.duration}
                onChange={e =>
                  handleEventDetailsChange(
                    'duration',
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="Event duration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={eventDetails.location?.address || ''}
                onChange={e =>
                  handleEventDetailsChange('location', {
                    ...eventDetails.location,
                    address: e.target.value,
                  })
                }
                placeholder="Event location"
              />
            </div>
          </div>

          <Button onClick={loadBudgetRecommendations} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Budget Recommendations
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Budget Overview */}
      {budgetPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Budget Overview</span>
              <Badge variant="outline" className="text-lg font-semibold">
                ${budgetPlan.totalBudget.toLocaleString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${budgetPlan.totalBudget.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Budget
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {budgetPlan.recommendations.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Service Categories
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {budgetPlan.packages.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Package Deals
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Planning Tabs */}
      {budgetPlan && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <BudgetRecommendations
              recommendations={budgetPlan.recommendations}
              totalBudget={budgetPlan.totalBudget}
              onRecommendationUpdate={handleBudgetUpdate}
            />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                Service breakdown component coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="adjustment" className="space-y-4">
            <BudgetAdjustment
              adjustments={budgetPlan.adjustments}
              onAdjustmentUpdate={handleBudgetUpdate}
            />
            <PricingDataDisplay
              serviceType={eventDetails.eventType}
              location={eventDetails.location}
            />
            <SeasonalAdjustments
              serviceType={eventDetails.eventType}
              eventDate={new Date().toISOString()}
              location={eventDetails.location}
            />
            <LocationVariations
              serviceType={eventDetails.eventType}
              location={eventDetails.location}
            />
            <PackageDeals
              packages={budgetPlan.packages}
              eventType={eventDetails.eventType}
              location={eventDetails.location}
              onPackageApply={handleBudgetUpdate}
            />
            <CostSavingSuggestions
              budgetPlan={budgetPlan}
              onSuggestionApply={handleBudgetUpdate}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <BudgetTracking
              tracking={budgetPlan.tracking}
              totalBudget={budgetPlan.totalBudget}
              onTrackingUpdate={handleBudgetUpdate}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <BudgetValidation
              budgetPlan={budgetPlan}
              onValidationUpdate={handleBudgetUpdate}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
