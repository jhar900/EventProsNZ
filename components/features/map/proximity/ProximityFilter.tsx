/**
 * Proximity Filter Component
 * Main proximity filtering interface for contractor discovery
 */

'use client';

import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Filter, X, Loader2 } from 'lucide-react';
import { useProximityFilter } from '@/hooks/useProximityFilter';
import { proximityService } from '@/lib/maps/proximity/proximity-service';
import { LocationInput } from './LocationInput';
import { ProximityResults } from './ProximityResults';
import { RadiusSelector } from './RadiusSelector';

export interface ProximityFilterProps {
  onContractorSelect?: (contractor: any) => void;
  className?: string;
}

export function ProximityFilter({
  onContractorSelect,
  className,
}: ProximityFilterProps) {
  const {
    searchLocation,
    searchRadius,
    serviceType,
    verifiedOnly,
    filteredContractors,
    locationSuggestions,
    isLoading,
    error,
    total,
    setSearchLocation,
    setSearchRadius,
    setServiceType,
    setVerifiedOnly,
    getLocationSuggestions,
    clearFilters,
    clearError,
  } = useProximityFilter();

  const [locationQuery, setLocationQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Service type options
  const serviceTypeOptions = [
    { value: 'catering', label: 'Catering' },
    { value: 'photography', label: 'Photography' },
    { value: 'music', label: 'Music & Entertainment' },
    { value: 'decorations', label: 'Decorations' },
    { value: 'venue', label: 'Venue' },
    { value: 'planning', label: 'Event Planning' },
    { value: 'security', label: 'Security' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ];

  // Handle location input change
  const handleLocationChange = (query: string) => {
    setLocationQuery(query);
    if (query.length >= 2) {
      getLocationSuggestions(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: any) => {
    setSearchLocation(suggestion.location);
    setLocationQuery(suggestion.formatted_address);
    setShowSuggestions(false);
  };

  // Handle clear location
  const handleClearLocation = () => {
    setSearchLocation(null);
    setLocationQuery('');
    setShowSuggestions(false);
  };

  // Handle clear all filters
  const handleClearAll = () => {
    clearFilters();
    setLocationQuery('');
    setShowSuggestions(false);
  };

  // Handle contractor selection
  const handleContractorSelect = (contractor: any) => {
    onContractorSelect?.(contractor);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Contractors Near You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Event Location</Label>
            <div className="relative">
              <LocationInput
                value={locationQuery}
                onChange={handleLocationChange}
                onSelect={handleLocationSelect}
                suggestions={locationSuggestions}
                showSuggestions={showSuggestions}
                onClear={handleClearLocation}
                placeholder="Enter your event location..."
                className="w-full"
              />
            </div>
            {searchLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {searchLocation.lat.toFixed(4)},{' '}
                  {searchLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Radius Selector */}
          <div className="space-y-2">
            <Label>Search Radius</Label>
            <RadiusSelector
              value={searchRadius}
              onChange={setSearchRadius}
              options={proximityService.getRadiusOptions()}
            />
          </div>

          {/* Service Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select
              value={serviceType || 'all'}
              onValueChange={value =>
                setServiceType(value === 'all' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {serviceTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verified Only Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="verified-only">Verified contractors only</Label>
            <Switch
              id="verified-only"
              checked={verifiedOnly}
              onCheckedChange={setVerifiedOnly}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
            {error && (
              <Button
                onClick={clearError}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-destructive"
              >
                <X className="h-4 w-4" />
                Clear Error
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Results Summary */}
          {searchLocation && (
            <div className="flex items-center justify-between rounded-md bg-muted p-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    `${total} contractors found`
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                {serviceType && (
                  <Badge variant="secondary">{serviceType}</Badge>
                )}
                {verifiedOnly && <Badge variant="secondary">Verified</Badge>}
                <Badge variant="outline">{searchRadius}km radius</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {searchLocation && (
        <ProximityResults
          contractors={filteredContractors}
          isLoading={isLoading}
          onContractorSelect={handleContractorSelect}
        />
      )}
    </div>
  );
}
