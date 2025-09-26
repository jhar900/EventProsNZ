'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trophy, Star, TrendingUp, Filter } from 'lucide-react';
import { ContractorMatch, ContractorRanking } from '@/types/matching';

interface ContractorRankingProps {
  matches: ContractorMatch[];
  algorithm: string;
}

export function ContractorRankingComponent({
  matches,
  algorithm,
}: ContractorRankingProps) {
  const [ranking, setRanking] = useState<ContractorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithm);
  const [sortBy, setSortBy] = useState<'score' | 'premium' | 'compatibility'>(
    'score'
  );

  useEffect(() => {
    if (matches.length > 0) {
      calculateRanking();
    }
  }, [matches, selectedAlgorithm]);

  const calculateRanking = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/matching/ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matches,
          algorithm: selectedAlgorithm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate ranking');
      }

      const data = await response.json();
      setRanking(data.ranking);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to calculate ranking'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
    return (
      <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    );
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

  const getRankingColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  const sortedRanking = [...ranking].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'premium':
        return b.is_premium ? 1 : -1;
      case 'compatibility':
        return b.score - a.score;
      default:
        return a.rank - b.rank;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Calculating ranking...</span>
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

  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No ranking data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Contractor Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Algorithm Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Algorithm:</span>
          </div>
          <Select
            value={selectedAlgorithm}
            onValueChange={setSelectedAlgorithm}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="premium_boost">Premium Boost</SelectItem>
              <SelectItem value="location_priority">
                Location Priority
              </SelectItem>
              <SelectItem value="budget_priority">Budget Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Sort by:</span>
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Overall Score</SelectItem>
              <SelectItem value="premium">Premium Status</SelectItem>
              <SelectItem value="compatibility">Compatibility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ranking List */}
        <div className="space-y-3">
          {sortedRanking.map((contractor, index) => (
            <div
              key={contractor.contractor_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRankIcon(contractor.rank)}
                  <span className="text-sm font-medium">
                    Rank #{contractor.rank}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Contractor {contractor.contractor_id.slice(0, 8)}
                    </span>
                    {contractor.is_premium && (
                      <Badge
                        variant="default"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Score: {Math.round(contractor.score * 100)}%</span>
                    <span className={getScoreColor(contractor.score)}>
                      {getScoreLabel(contractor.score)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Match Reasons:</span>
                  <Badge
                    variant="secondary"
                    className={getRankingColor(contractor.rank)}
                  >
                    {contractor.match_reasons.length} factors
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {contractor.match_reasons
                    .slice(0, 2)
                    .map((reason, reasonIndex) => (
                      <Badge
                        key={reasonIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {reason}
                      </Badge>
                    ))}
                  {contractor.match_reasons.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{contractor.match_reasons.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ranking Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-yellow-600">
              {ranking.filter(r => r.rank <= 3).length}
            </p>
            <p className="text-sm text-muted-foreground">Top 3</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-green-600">
              {ranking.filter(r => r.score >= 0.8).length}
            </p>
            <p className="text-sm text-muted-foreground">High Score</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              {ranking.filter(r => r.is_premium).length}
            </p>
            <p className="text-sm text-muted-foreground">Premium</p>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-sm mb-2">Algorithm Information</h3>
          <p className="text-sm text-muted-foreground">
            {selectedAlgorithm === 'default' &&
              'Balanced scoring across all factors'}
            {selectedAlgorithm === 'premium_boost' &&
              'Prioritizes premium contractors with quality boost'}
            {selectedAlgorithm === 'location_priority' &&
              'Emphasizes location and proximity factors'}
            {selectedAlgorithm === 'budget_priority' &&
              'Focuses on budget compatibility and value'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
