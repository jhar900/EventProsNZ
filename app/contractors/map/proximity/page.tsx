/**
 * Proximity Filtering Page
 * Page for proximity-based contractor discovery
 */

'use client';

import React, { useState } from 'react';
import { ProximityFilter } from '@/components/features/map/proximity/ProximityFilter';
import { ProximityMap } from '@/components/features/map/proximity/ProximityMap';
import { ProximityContractor } from '@/lib/maps/proximity/proximity-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, List, Grid } from 'lucide-react';

export default function ProximityPage() {
  const [selectedContractor, setSelectedContractor] =
    useState<ProximityContractor | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const handleContractorSelect = (contractor: ProximityContractor) => {
    setSelectedContractor(contractor);
  };

  const handleViewModeChange = (mode: 'map' | 'list') => {
    setViewMode(mode);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Contractors Near You</h1>
        <p className="text-muted-foreground">
          Discover contractors in your area for your next event
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex justify-end">
        <div className="flex rounded-lg border p-1">
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('map')}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Map View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            List View
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <ProximityFilter onContractorSelect={handleContractorSelect} />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {viewMode === 'map' ? (
            <ProximityMap
              selectedContractor={selectedContractor}
              onContractorSelect={handleContractorSelect}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contractor Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>List view will show contractor results here</p>
                  <p className="text-sm">
                    Use the filters on the left to find contractors
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Selected Contractor Details */}
      {selectedContractor && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Selected Contractor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedContractor.company_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedContractor.business_address}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-sm bg-muted px-2 py-1 rounded">
                      {selectedContractor.service_type}
                    </span>
                    {selectedContractor.distance && (
                      <span className="text-sm bg-muted px-2 py-1 rounded">
                        {selectedContractor.distance.toFixed(1)}km away
                      </span>
                    )}
                    {selectedContractor.is_verified && (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    window.open(
                      `/contractors/${selectedContractor.id}`,
                      '_blank'
                    )
                  }
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
