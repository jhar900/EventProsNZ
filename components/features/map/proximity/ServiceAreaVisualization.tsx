/**
 * Service Area Visualization Component
 * Displays service area coverage for contractor profiles
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { ServiceArea } from '@/lib/maps/proximity/proximity-service';

export interface ServiceAreaVisualizationProps {
  serviceAreas: ServiceArea[];
  businessLocation: { lat: number; lng: number } | null;
  contractorName: string;
  className?: string;
}

export function ServiceAreaVisualization({
  serviceAreas,
  businessLocation,
  contractorName,
  className,
}: ServiceAreaVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize map visualization
  useEffect(() => {
    if (!mapRef.current || !businessLocation || serviceAreas.length === 0) {
      return;
    }

    // In a real implementation, you would initialize Mapbox GL JS here
    // and render the service areas as polygons or circles
    // For now, we'll just show the service area information
  }, [serviceAreas, businessLocation]);

  if (!businessLocation || serviceAreas.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No service areas defined</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Service Areas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Location */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <div className="flex-shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Business Location</p>
            <p className="text-sm text-muted-foreground">
              {businessLocation.lat.toFixed(4)},{' '}
              {businessLocation.lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Service Areas */}
        <div className="space-y-3">
          {serviceAreas.map((area, index) => (
            <div
              key={area.id}
              className="flex items-start gap-3 p-3 rounded-lg border"
            >
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`h-3 w-3 rounded-full ${
                    area.type === 'radius' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{area.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {area.type}
                  </Badge>
                </div>
                {area.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {area.description}
                  </p>
                )}
                {area.radius && (
                  <p className="text-sm text-muted-foreground">
                    Radius: {area.radius}km
                  </p>
                )}
                {area.coordinates && area.coordinates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {area.coordinates.length} coordinate
                    {area.coordinates.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map Placeholder */}
        <div className="mt-4">
          <div
            ref={mapRef}
            className="h-48 w-full rounded-lg border bg-muted flex items-center justify-center"
          >
            <div className="text-center text-muted-foreground">
              <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Map visualization would appear here</p>
              <p className="text-xs">Service areas: {serviceAreas.length}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Radius-based areas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Polygon areas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
