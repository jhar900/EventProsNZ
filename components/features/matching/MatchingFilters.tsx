'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Filter, X } from 'lucide-react';
import { MatchingFilters } from '@/types/matching';

interface MatchingFiltersProps {
  filters: MatchingFilters;
  onFiltersChange: (filters: MatchingFilters) => void;
}

export function MatchingFiltersComponent({
  filters,
  onFiltersChange,
}: MatchingFiltersProps) {
  const handleServiceTypeChange = (serviceType: string, checked: boolean) => {
    const currentTypes = filters.service_types || [];
    const newTypes = checked
      ? [...currentTypes, serviceType]
      : currentTypes.filter(type => type !== serviceType);

    onFiltersChange({
      ...filters,
      service_types: newTypes,
    });
  };

  const handleBudgetRangeChange = (field: 'min' | 'max', value: number) => {
    const currentRange = filters.budget_range || { min: 0, max: 10000 };
    onFiltersChange({
      ...filters,
      budget_range: {
        ...currentRange,
        [field]: value,
      },
    });
  };

  const handleLocationChange = (field: string, value: number) => {
    const currentLocation = filters.location || {
      lat: 0,
      lng: 0,
      radius_km: 50,
    };
    onFiltersChange({
      ...filters,
      location: {
        ...currentLocation,
        [field]: value,
      },
    });
  };

  const handleAvailabilityDateChange = (date: string) => {
    onFiltersChange({
      ...filters,
      availability_date: date,
    });
  };

  const handleMinRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      min_rating: rating,
    });
  };

  const handlePremiumChange = (premium: boolean) => {
    onFiltersChange({
      ...filters,
      is_premium: premium,
    });
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as any,
      sort_order: sortOrder as any,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const serviceTypes = [
    'Photography',
    'Videography',
    'Catering',
    'Music',
    'Decorations',
    'Venue',
    'Transportation',
    'Security',
    'Entertainment',
    'Floral',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Matching Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Types */}
        <div className="space-y-3">
          <Label>Service Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {serviceTypes.map(serviceType => (
              <div key={serviceType} className="flex items-center space-x-2">
                <Checkbox
                  id={serviceType}
                  checked={
                    filters.service_types?.includes(serviceType) || false
                  }
                  onCheckedChange={checked =>
                    handleServiceTypeChange(serviceType, checked as boolean)
                  }
                />
                <Label htmlFor={serviceType} className="text-sm">
                  {serviceType}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-3">
          <Label>Budget Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-min" className="text-sm">
                Minimum
              </Label>
              <Input
                id="budget-min"
                type="number"
                placeholder="0"
                value={filters.budget_range?.min || ''}
                onChange={e =>
                  handleBudgetRangeChange('min', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-max" className="text-sm">
                Maximum
              </Label>
              <Input
                id="budget-max"
                type="number"
                placeholder="10000"
                value={filters.budget_range?.max || ''}
                onChange={e =>
                  handleBudgetRangeChange(
                    'max',
                    parseInt(e.target.value) || 10000
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label>Location</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat" className="text-sm">
                Latitude
              </Label>
              <Input
                id="lat"
                type="number"
                step="0.000001"
                placeholder="0.000000"
                value={filters.location?.lat || ''}
                onChange={e =>
                  handleLocationChange('lat', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng" className="text-sm">
                Longitude
              </Label>
              <Input
                id="lng"
                type="number"
                step="0.000001"
                placeholder="0.000000"
                value={filters.location?.lng || ''}
                onChange={e =>
                  handleLocationChange('lng', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius" className="text-sm">
              Search Radius: {filters.location?.radius_km || 50} km
            </Label>
            <Slider
              id="radius"
              min={1}
              max={200}
              step={1}
              value={[filters.location?.radius_km || 50]}
              onValueChange={([value]) =>
                handleLocationChange('radius_km', value)
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Availability Date */}
        <div className="space-y-2">
          <Label htmlFor="availability-date">Availability Date</Label>
          <Input
            id="availability-date"
            type="date"
            value={filters.availability_date || ''}
            onChange={e => handleAvailabilityDateChange(e.target.value)}
          />
        </div>

        {/* Minimum Rating */}
        <div className="space-y-2">
          <Label htmlFor="min-rating" className="text-sm">
            Minimum Rating: {filters.min_rating || 0} stars
          </Label>
          <Slider
            id="min-rating"
            min={0}
            max={5}
            step={0.5}
            value={[filters.min_rating || 0]}
            onValueChange={([value]) => handleMinRatingChange(value)}
            className="w-full"
          />
        </div>

        {/* Premium Only */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="premium-only"
            checked={filters.is_premium || false}
            onCheckedChange={checked => handlePremiumChange(checked as boolean)}
          />
          <Label htmlFor="premium-only">Premium contractors only</Label>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <Label>Sort By</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sort-by" className="text-sm">
                Sort Field
              </Label>
              <Select
                value={filters.sort_by || 'score'}
                onValueChange={value =>
                  handleSortChange(value, filters.sort_order || 'desc')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Overall Score</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-order" className="text-sm">
                Sort Order
              </Label>
              <Select
                value={filters.sort_order || 'desc'}
                onValueChange={value =>
                  handleSortChange(filters.sort_by || 'score', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={clearFilters} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
