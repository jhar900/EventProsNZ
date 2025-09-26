import { useState, useEffect, useCallback } from 'react';
import {
  ContractorMatch,
  MatchingFilters,
  MatchingRequest,
  MatchingResponse,
} from '@/types/matching';

interface UseContractorMatchingProps {
  eventId: string;
  initialFilters?: MatchingFilters;
}

interface UseContractorMatchingReturn {
  matches: ContractorMatch[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: MatchingFilters;
  findMatches: (filters?: MatchingFilters) => Promise<void>;
  updateFilters: (newFilters: MatchingFilters) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refresh: () => Promise<void>;
}

export function useContractorMatching({
  eventId,
  initialFilters = {},
}: UseContractorMatchingProps): UseContractorMatchingReturn {
  const [matches, setMatches] = useState<ContractorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<MatchingFilters>(initialFilters);

  const findMatches = useCallback(
    async (newFilters?: MatchingFilters) => {
      setLoading(true);
      setError(null);

      try {
        const request: MatchingRequest = {
          event_id: eventId,
          filters: newFilters || filters,
          page: pagination.page,
          limit: pagination.limit,
        };

        const response = await fetch('/api/matching/contractors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error('Failed to find matches');
        }

        const data: MatchingResponse = await response.json();
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
    },
    [eventId, filters, pagination.page, pagination.limit]
  );

  const updateFilters = useCallback((newFilters: MatchingFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const refresh = useCallback(async () => {
    await findMatches();
  }, [findMatches]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (eventId) {
      findMatches();
    }
  }, [eventId, pagination.page, pagination.limit]);

  // Auto-fetch when filters change
  useEffect(() => {
    if (eventId) {
      findMatches(filters);
    }
  }, [filters]);

  return {
    matches,
    loading,
    error,
    pagination,
    filters,
    findMatches,
    updateFilters,
    setPage,
    setLimit,
    refresh,
  };
}
