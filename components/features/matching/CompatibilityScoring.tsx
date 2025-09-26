'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Star,
  TrendingUp,
  Target,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react';
import { CompatibilityScore, ScoreBreakdown } from '@/types/matching';

interface CompatibilityScoringProps {
  eventId: string;
  contractorId: string;
}

export function CompatibilityScoring({
  eventId,
  contractorId,
}: CompatibilityScoringProps) {
  const [compatibility, setCompatibility] = useState<CompatibilityScore | null>(
    null
  );
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && contractorId) {
      fetchCompatibility();
    }
  }, [eventId, contractorId]);

  const fetchCompatibility = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matching/compatibility?event_id=${eventId}&contractor_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch compatibility score');
      }

      const data = await response.json();
      setCompatibility(data.compatibility);
      setBreakdown(data.breakdown);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch compatibility score'
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

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <Star className="h-4 w-4 text-yellow-500" />;
    if (score >= 0.6) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Calculating compatibility...</span>
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

  if (!compatibility || !breakdown) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No compatibility data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreItems = [
    {
      label: 'Service Type',
      score: compatibility.service_type_score,
      icon: <Target className="h-4 w-4" />,
      description: "How well the contractor's services match your event needs",
    },
    {
      label: 'Experience',
      score: compatibility.experience_score,
      icon: <Star className="h-4 w-4" />,
      description: "Contractor's experience level and track record",
    },
    {
      label: 'Pricing',
      score: compatibility.pricing_score,
      icon: <DollarSign className="h-4 w-4" />,
      description: "How well the contractor's pricing fits your budget",
    },
    {
      label: 'Location',
      score: compatibility.location_score,
      icon: <MapPin className="h-4 w-4" />,
      description: 'Geographic compatibility and service area coverage',
    },
    {
      label: 'Performance',
      score: compatibility.performance_score,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Past performance and reliability metrics',
    },
    {
      label: 'Availability',
      score: compatibility.availability_score,
      icon: <Clock className="h-4 w-4" />,
      description: 'Availability for your event date and time',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Compatibility Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {getScoreIcon(compatibility.overall_score)}
            <span className="text-2xl font-bold">
              {Math.round(compatibility.overall_score * 100)}%
            </span>
          </div>
          <p
            className={`text-lg font-medium ${getScoreColor(compatibility.overall_score)}`}
          >
            {getScoreLabel(compatibility.overall_score)}
          </p>
          <Progress value={compatibility.overall_score * 100} className="h-3" />
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold">Score Breakdown</h3>
          {scoreItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getScoreColor(item.score)}`}>
                    {Math.round(item.score * 100)}%
                  </span>
                  <Badge
                    variant={
                      item.score >= 0.8
                        ? 'default'
                        : item.score >= 0.6
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {getScoreLabel(item.score)}
                  </Badge>
                </div>
              </div>
              <Progress value={item.score * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold">Recommendations</h3>
          <div className="space-y-1">
            {compatibility.service_type_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Consider contractors with more relevant service experience
              </p>
            )}
            {compatibility.pricing_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Budget may need adjustment or consider different pricing tiers
              </p>
            )}
            {compatibility.location_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Location may require additional travel costs
              </p>
            )}
            {compatibility.availability_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Check alternative dates or contractor availability
              </p>
            )}
            {compatibility.overall_score >= 0.8 && (
              <p className="text-sm text-green-600">
                • Excellent match! This contractor meets most of your
                requirements
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
