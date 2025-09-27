'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
} from 'lucide-react';
import { ContractorMatch, MatchingFilters } from '@/types/matching';
import { EventRequirementAnalysis } from './EventRequirementAnalysis';
import { CompatibilityScoring } from './CompatibilityScoring';
import { AvailabilityChecker } from './AvailabilityChecker';
import { BudgetCompatibilityComponent } from './BudgetCompatibility';
import { LocationMatching } from './LocationMatching';
import { PerformanceIntegration } from './PerformanceIntegration';
import { ContractorRankingComponent } from './ContractorRanking';
import { MatchingResults } from './MatchingResults';
import { InquiryIntegration } from './InquiryIntegration';
import { MatchingFiltersComponent } from './MatchingFilters';
import { MatchingPagination } from './MatchingPagination';

interface ContractorMatchingProps {
  eventId: string;
  onMatchSelect?: (match: ContractorMatch) => void;
}

export function ContractorMatching({
  eventId,
  onMatchSelect,
}: ContractorMatchingProps) {
  const [matches, setMatches] = useState<ContractorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchingFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [selectedMatch, setSelectedMatch] = useState<ContractorMatch | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    if (eventId) {
      findMatches();
    }
  }, [eventId, filters, pagination.page]);

  const findMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/matching/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          filters,
          page: pagination.page,
          limit: pagination.limit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: MatchingFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleMatchSelect = (match: ContractorMatch) => {
    setSelectedMatch(match);
    onMatchSelect?.(match);
  };

  const handleInquiry = async (contractorId: string, message: string) => {
    try {
      const response = await fetch('/api/matching/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          contractor_id: contractorId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send inquiry');
      }

      // Show success message or handle success
      } catch (err) {
      }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Intelligent Contractor Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <EventRequirementAnalysis eventId={eventId} />
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <MatchingFiltersComponent
                filters={filters}
                onFiltersChange={handleFilterChange}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {pagination.total} contractors found
                  </span>
                </div>
                <Button
                  onClick={findMatches}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Refresh
                </Button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Finding matches...</span>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/15 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  <MatchingResults
                    matches={matches}
                    onMatchSelect={handleMatchSelect}
                    selectedMatch={selectedMatch}
                  />

                  <MatchingPagination
                    currentPage={pagination.page}
                    totalPages={Math.ceil(pagination.total / pagination.limit)}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        Premium Matches
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {matches.filter(m => m.is_premium).length}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        Location Matches
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {matches.filter(m => m.location_score > 0.7).length}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">
                        Budget Matches
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {matches.filter(m => m.budget_score > 0.7).length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompatibilityScoring
            eventId={eventId}
            contractorId={selectedMatch.contractor_id}
          />

          <AvailabilityChecker
            contractorId={selectedMatch.contractor_id}
            eventDate={new Date().toISOString()}
            duration={8}
          />

          <BudgetCompatibilityComponent
            eventId={eventId}
            contractorId={selectedMatch.contractor_id}
          />

          <LocationMatching
            eventId={eventId}
            contractorId={selectedMatch.contractor_id}
          />

          <PerformanceIntegration contractorId={selectedMatch.contractor_id} />

          <ContractorRankingComponent matches={matches} algorithm="default" />
        </div>
      )}

      {selectedMatch && (
        <InquiryIntegration
          eventId={eventId}
          contractorId={selectedMatch.contractor_id}
          onInquiry={handleInquiry}
        />
      )}
    </div>
  );
}
