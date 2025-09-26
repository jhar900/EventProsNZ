'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Navigation, Car, Train, Plane } from 'lucide-react';
import { LocationMatch } from '@/types/matching';

interface LocationMatchingProps {
  eventId: string;
  contractorId: string;
}

export function LocationMatching({
  eventId,
  contractorId,
}: LocationMatchingProps) {
  const [locationMatch, setLocationMatch] = useState<LocationMatch | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && contractorId) {
      fetchLocationMatch();
    }
  }, [eventId, contractorId]);

  const fetchLocationMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matching/location?event_id=${eventId}&contractor_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location match');
      }

      const data = await response.json();
      setLocationMatch(data.location_match);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch location match'
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Poor';
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 10) return 'text-green-600';
    if (distance < 25) return 'text-yellow-600';
    if (distance < 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDistanceLabel = (distance: number) => {
    if (distance < 10) return 'Very Close';
    if (distance < 25) return 'Close';
    if (distance < 50) return 'Moderate';
    if (distance < 100) return 'Far';
    return 'Very Far';
  };

  const getTransportIcon = (distance: number) => {
    if (distance < 10) return <Car className="h-4 w-4" />;
    if (distance < 50) return <Train className="h-4 w-4" />;
    return <Plane className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Calculating location match...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!locationMatch) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No location match data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const locationItems = [
    {
      label: 'Distance',
      value: `${locationMatch.distance_km.toFixed(1)} km`,
      score: locationMatch.proximity_score,
      description: 'Distance from event location to contractor',
    },
    {
      label: 'Service Area Coverage',
      value: `${Math.round(locationMatch.service_area_coverage * 100)}%`,
      score: locationMatch.service_area_coverage,
      description: 'How well the contractor covers your event area',
    },
    {
      label: 'Proximity Score',
      value: `${Math.round(locationMatch.proximity_score * 100)}%`,
      score: locationMatch.proximity_score,
      description: 'Overall proximity and accessibility rating',
    },
    {
      label: 'Accessibility',
      value: `${Math.round(locationMatch.accessibility_score * 100)}%`,
      score: locationMatch.accessibility_score,
      description: 'Transport links and accessibility to the location',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5" />
            <span className="text-2xl font-bold">
              {Math.round(locationMatch.overall_score * 100)}%
            </span>
          </div>
          <p
            className={`text-lg font-medium ${getScoreColor(locationMatch.overall_score)}`}
          >
            {getScoreLabel(locationMatch.overall_score)}
          </p>
          <Progress value={locationMatch.overall_score * 100} className="h-3" />
        </div>

        {/* Distance Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTransportIcon(locationMatch.distance_km)}
              <span className="font-medium">Distance</span>
            </div>
            <div className="text-right">
              <p
                className={`font-bold ${getDistanceColor(locationMatch.distance_km)}`}
              >
                {locationMatch.distance_km.toFixed(1)} km
              </p>
              <p className="text-sm text-muted-foreground">
                {getDistanceLabel(locationMatch.distance_km)}
              </p>
            </div>
          </div>
          <Progress
            value={locationMatch.proximity_score * 100}
            className="h-2"
          />
        </div>

        {/* Location Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold">Location Analysis</h3>
          {locationItems.slice(1).map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                <span className={`font-medium ${getScoreColor(item.score)}`}>
                  {item.value}
                </span>
              </div>
              <Progress value={item.score * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Travel Information */}
        <div className="space-y-2">
          <h3 className="font-semibold">Travel Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Estimated Travel Time</p>
              <p className="text-sm text-muted-foreground">
                {locationMatch.distance_km < 10
                  ? '15-30 minutes'
                  : locationMatch.distance_km < 25
                    ? '30-60 minutes'
                    : locationMatch.distance_km < 50
                      ? '1-2 hours'
                      : '2+ hours'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Transport Options</p>
              <p className="text-sm text-muted-foreground">
                {locationMatch.distance_km < 10
                  ? 'Car, Public Transport'
                  : locationMatch.distance_km < 50
                    ? 'Car, Train, Bus'
                    : 'Car, Plane'}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold">Location Recommendations</h3>
          <div className="space-y-1">
            {locationMatch.distance_km < 25 ? (
              <Alert>
                <Navigation className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-green-600">
                    ✓ Contractor is within reasonable distance
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-red-600">
                    ✗ Contractor is far from your event location
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {locationMatch.service_area_coverage < 0.7 && (
              <p className="text-sm text-amber-600">
                • Verify contractor covers your specific event area
              </p>
            )}

            {locationMatch.accessibility_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Consider transport accessibility for contractor
              </p>
            )}

            {locationMatch.distance_km > 50 && (
              <p className="text-sm text-amber-600">
                • Factor in additional travel costs and time
              </p>
            )}

            {locationMatch.overall_score >= 0.8 && (
              <p className="text-sm text-green-600">
                • Excellent location match! Contractor is well-positioned for
                your event
              </p>
            )}
          </div>
        </div>

        {/* Location Tips */}
        <div className="space-y-2">
          <h3 className="font-semibold">Location Tips</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              • Consider travel time and costs in your budget
            </p>
            <p className="text-sm text-muted-foreground">
              • Verify contractor has experience in your area
            </p>
            <p className="text-sm text-muted-foreground">
              • Discuss setup and breakdown time requirements
            </p>
            <p className="text-sm text-muted-foreground">
              • Ask about local permits and regulations
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
