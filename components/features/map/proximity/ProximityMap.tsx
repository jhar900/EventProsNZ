/**
 * Proximity Map Component
 * Map integration for proximity filtering
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { ProximityContractor } from '@/lib/maps/proximity/proximity-service';
import { useProximityFilter } from '@/hooks/useProximityFilter';

export interface ProximityMapProps {
  selectedContractor: ProximityContractor | null;
  onContractorSelect: (contractor: ProximityContractor) => void;
  className?: string;
}

export function ProximityMap({
  selectedContractor,
  onContractorSelect,
  className,
}: ProximityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { filteredContractors, searchLocation, searchRadius } =
    useProximityFilter();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // In a real implementation, you would initialize Mapbox GL JS here
    // For now, we'll just show a placeholder
    setMapLoaded(true);
  }, []);

  // Update map when contractors change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // In a real implementation, you would update the map markers here
    // based on the filteredContractors data
  }, [filteredContractors, mapLoaded]);

  // Handle contractor marker click
  const handleContractorClick = (contractor: ProximityContractor) => {
    onContractorSelect(contractor);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Map View
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div
          ref={mapRef}
          className="h-96 w-full rounded-lg border bg-muted relative overflow-hidden"
        >
          {/* Map Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Navigation className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
              <p className="text-sm mb-4">
                Map visualization would appear here with contractor markers
              </p>
              {searchLocation && (
                <div className="text-xs">
                  <p>
                    Search Center: {searchLocation.lat.toFixed(4)},{' '}
                    {searchLocation.lng.toFixed(4)}
                  </p>
                  <p>Radius: {searchRadius}km</p>
                  <p>Contractors: {filteredContractors.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="sm" variant="secondary">
              <Navigation className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Contractors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Search Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contractor List */}
        {filteredContractors.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-3">
              Nearby Contractors ({filteredContractors.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredContractors.slice(0, 5).map(contractor => (
                <div
                  key={contractor.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedContractor?.id === contractor.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleContractorClick(contractor)}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        selectedContractor?.id === contractor.id
                          ? 'bg-primary'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {contractor.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contractor.service_type}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {contractor.distance && (
                      <Badge variant="outline" className="text-xs">
                        {contractor.distance.toFixed(1)}km
                      </Badge>
                    )}
                    {contractor.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {filteredContractors.length > 5 && (
                <div className="text-center py-2">
                  <Button variant="outline" size="sm">
                    View All {filteredContractors.length} Contractors
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Contractor Info */}
        {selectedContractor && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {selectedContractor.company_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedContractor.business_address}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedContractor.service_type}
                  </Badge>
                  {selectedContractor.distance && (
                    <Badge variant="outline" className="text-xs">
                      {selectedContractor.distance.toFixed(1)}km away
                    </Badge>
                  )}
                  {selectedContractor.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  window.open(`/contractors/${selectedContractor.id}`, '_blank')
                }
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Profile
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
