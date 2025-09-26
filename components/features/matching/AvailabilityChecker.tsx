'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { AvailabilityResult, AvailabilityConflict } from '@/types/matching';

interface AvailabilityCheckerProps {
  contractorId: string;
  eventDate: string;
  duration: number;
}

export function AvailabilityChecker({
  contractorId,
  eventDate,
  duration,
}: AvailabilityCheckerProps) {
  const [availability, setAvailability] = useState<AvailabilityResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractorId && eventDate) {
      checkAvailability();
    }
  }, [contractorId, eventDate, duration]);

  const checkAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matching/availability?contractor_id=${contractorId}&event_date=${eventDate}&duration=${duration}`
      );

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      setAvailability(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to check availability'
      );
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getAvailabilityColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  const getAvailabilityLabel = (available: boolean) => {
    return available ? 'Available' : 'Not Available';
  };

  const getConflictIcon = (conflictType: string) => {
    switch (conflictType) {
      case 'double_booking':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'time_conflict':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictColor = (conflictType: string) => {
    switch (conflictType) {
      case 'double_booking':
        return 'text-amber-600';
      case 'unavailable':
        return 'text-red-600';
      case 'time_conflict':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking availability...</span>
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

  if (!availability) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No availability data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Availability Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {getAvailabilityIcon(availability.available)}
            <span
              className={`text-xl font-bold ${getAvailabilityColor(availability.available)}`}
            >
              {getAvailabilityLabel(availability.available)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Event Date: {new Date(eventDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: {duration} hours
          </p>
        </div>

        {/* Availability Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Availability Score</span>
            <span>{Math.round(availability.availability_score * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                availability.availability_score >= 0.8
                  ? 'bg-green-500'
                  : availability.availability_score >= 0.6
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${availability.availability_score * 100}%` }}
            />
          </div>
        </div>

        {/* Conflicts */}
        {availability.conflicts && availability.conflicts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Conflicts Detected</h3>
            <div className="space-y-2">
              {availability.conflicts.map((conflict, index) => (
                <Alert key={index} variant="destructive">
                  <div className="flex items-start gap-2">
                    {getConflictIcon(conflict.conflict_type)}
                    <AlertDescription>
                      <div className="space-y-1">
                        <p
                          className={`font-medium ${getConflictColor(conflict.conflict_type)}`}
                        >
                          {conflict.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conflict.event_date} {conflict.start_time} -{' '}
                          {conflict.end_time}
                        </p>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Recommendations</h3>
          <div className="space-y-1">
            {availability.available ? (
              <p className="text-sm text-green-600">
                ✓ Contractor is available for your event date
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-red-600">
                  ✗ Contractor is not available for your event date
                </p>
                <p className="text-sm text-muted-foreground">
                  • Consider alternative dates
                </p>
                <p className="text-sm text-muted-foreground">
                  • Look for other contractors with similar services
                </p>
                <p className="text-sm text-muted-foreground">
                  • Contact contractor to discuss flexibility
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={checkAvailability}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Recheck
          </Button>
          {availability.available && (
            <Button size="sm" className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Proceed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
