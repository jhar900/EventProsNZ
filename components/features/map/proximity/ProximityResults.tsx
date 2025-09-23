/**
 * Proximity Results Component
 * Displays proximity-based contractor results
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { ProximityContractor } from '@/lib/maps/proximity/proximity-service';
import { proximityService } from '@/lib/maps/proximity/proximity-service';

export interface ProximityResultsProps {
  contractors: ProximityContractor[];
  isLoading: boolean;
  onContractorSelect?: (contractor: ProximityContractor) => void;
  className?: string;
}

export function ProximityResults({
  contractors,
  isLoading,
  onContractorSelect,
  className,
}: ProximityResultsProps) {
  // Handle contractor selection
  const handleContractorSelect = (contractor: ProximityContractor) => {
    onContractorSelect?.(contractor);
  };

  // Handle view profile
  const handleViewProfile = (contractorId: string) => {
    window.open(`/contractors/${contractorId}`, '_blank');
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching for contractors...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results
  if (contractors.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contractors found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search radius or location to find more
            contractors.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Contractors ({contractors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contractors.map(contractor => (
            <div
              key={contractor.id}
              className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={`/api/avatar/${contractor.id}`} />
                <AvatarFallback>
                  {contractor.company_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {contractor.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {contractor.business_address}
                    </p>
                  </div>

                  {/* Verification Badge */}
                  {contractor.is_verified && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Service Type and Distance */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{contractor.service_type}</Badge>
                  {contractor.distance && (
                    <Badge variant="outline">
                      {proximityService.formatDistance(contractor.distance)}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {contractor.subscription_tier}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleContractorSelect(contractor)}
                  >
                    Select
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewProfile(contractor.id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button (if needed) */}
        {contractors.length >= 20 && (
          <div className="mt-6 text-center">
            <Button variant="outline">Load More Results</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
