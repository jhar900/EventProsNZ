'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { ContractorMatch } from '@/types/matching';

interface MatchingResultsProps {
  matches: ContractorMatch[];
  onMatchSelect?: (match: ContractorMatch) => void;
  selectedMatch?: ContractorMatch | null;
}

export function MatchingResults({
  matches,
  onMatchSelect,
  selectedMatch,
}: MatchingResultsProps) {
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
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 0.6)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No matching contractors found</p>
            <p className="text-sm">
              Try adjusting your filters or requirements
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, index) => (
        <Card
          key={match.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedMatch?.id === match.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onMatchSelect?.(match)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">#{index + 1}</span>
                    {match.is_premium && (
                      <Badge
                        variant="default"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Contractor {match.contractor_id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Match Algorithm: {match.match_algorithm}
                    </p>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Match Score</span>
                    <div className="flex items-center gap-2">
                      {getScoreIcon(match.overall_score)}
                      <span
                        className={`font-bold ${getScoreColor(match.overall_score)}`}
                      >
                        {Math.round(match.overall_score * 100)}%
                      </span>
                      <Badge
                        className={getOverallScoreColor(match.overall_score)}
                      >
                        {getScoreLabel(match.overall_score)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={match.overall_score * 100} className="h-2" />
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs font-medium">Compatibility</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${getScoreColor(match.compatibility_score)}`}
                      >
                        {Math.round(match.compatibility_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={match.compatibility_score * 100}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">Availability</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${getScoreColor(match.availability_score)}`}
                      >
                        {Math.round(match.availability_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={match.availability_score * 100}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs font-medium">Budget</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${getScoreColor(match.budget_score)}`}
                      >
                        {Math.round(match.budget_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={match.budget_score * 100}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs font-medium">Location</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${getScoreColor(match.location_score)}`}
                      >
                        {Math.round(match.location_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={match.location_score * 100}
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs font-medium">Performance</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${getScoreColor(match.performance_score)}`}
                      >
                        {Math.round(match.performance_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={match.performance_score * 100}
                      className="h-1"
                    />
                  </div>
                </div>

                {/* Match Insights */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Match Insights</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.compatibility_score > 0.8 && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        High Compatibility
                      </Badge>
                    )}
                    {match.availability_score > 0.8 && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-200"
                      >
                        Available
                      </Badge>
                    )}
                    {match.budget_score > 0.8 && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        Budget Fit
                      </Badge>
                    )}
                    {match.location_score > 0.8 && (
                      <Badge
                        variant="outline"
                        className="text-purple-600 border-purple-200"
                      >
                        Local
                      </Badge>
                    )}
                    {match.performance_score > 0.8 && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-200"
                      >
                        High Performance
                      </Badge>
                    )}
                    {match.is_premium && (
                      <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-200"
                      >
                        Premium Service
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  variant={
                    selectedMatch?.id === match.id ? 'default' : 'outline'
                  }
                  onClick={e => {
                    e.stopPropagation();
                    onMatchSelect?.(match);
                  }}
                >
                  {selectedMatch?.id === match.id ? 'Selected' : 'Select'}
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
