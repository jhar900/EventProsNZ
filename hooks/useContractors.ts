import { useState, useEffect, useCallback } from 'react';
import {
  Contractor,
  ContractorFilters,
  PaginationState,
  ViewMode,
  SortOption,
} from '@/types/contractors';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';

interface UseContractorsState {
  contractors: Contractor[];
  featuredContractors: Contractor[];
  currentContractor: Contractor | null;
  filters: ContractorFilters;
  pagination: PaginationState;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}

interface UseContractorsActions {
  fetchContractors: (
    filters?: Partial<ContractorFilters>,
    page?: number
  ) => Promise<void>;
  searchContractors: (
    filters?: Partial<ContractorFilters>,
    page?: number
  ) => Promise<void>;
  fetchFeaturedContractors: () => Promise<void>;
  fetchContractorDetails: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  updateFilters: (filters: Partial<ContractorFilters>) => void;
  loadMore: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useContractors(): UseContractorsState & UseContractorsActions {
  const [state, setState] = useState<UseContractorsState>({
    contractors: [],
    featuredContractors: [],
    currentContractor: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
    viewMode: 'grid',
    isLoading: false,
    error: null,
  });

  const fetchContractors = useCallback(
    async (filters: Partial<ContractorFilters> = {}, page: number = 1) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await ContractorDirectoryService.getContractors(
          { ...state.filters, ...filters },
          page,
          state.pagination.limit,
          'premium_first'
        );

        setState(prev => ({
          ...prev,
          contractors:
            page === 1
              ? response.contractors
              : [...prev.contractors, ...response.contractors],
          pagination: {
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
          },
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error fetching contractors:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch contractors',
          isLoading: false,
        }));
      }
    },
    [] // Remove dependencies to prevent infinite loops
  );

  const searchContractors = useCallback(
    async (filters: Partial<ContractorFilters> = {}, page: number = 1) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await ContractorDirectoryService.searchContractors(
          { ...state.filters, ...filters },
          page,
          state.pagination.limit
        );

        setState(prev => ({
          ...prev,
          contractors:
            page === 1
              ? response.contractors
              : [...prev.contractors, ...response.contractors],
          pagination: {
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
          },
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error searching contractors:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to search contractors',
          isLoading: false,
        }));
      }
    },
    [] // Remove dependencies to prevent infinite loops
  );

  const fetchFeaturedContractors = useCallback(async () => {
    try {
      const response =
        await ContractorDirectoryService.getFeaturedContractors(6);
      setState(prev => ({
        ...prev,
        featuredContractors: response.contractors,
      }));
    } catch (error) {
      console.error('Failed to fetch featured contractors:', error);
    }
  }, []);

  const fetchContractorDetails = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response =
        await ContractorDirectoryService.getContractorDetails(id);
      setState(prev => ({
        ...prev,
        currentContractor: response.contractor,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch contractor details',
        isLoading: false,
      }));
    }
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const updateFilters = useCallback((filters: Partial<ContractorFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  const loadMore = useCallback(async () => {
    if (
      state.pagination.page < state.pagination.totalPages &&
      !state.isLoading
    ) {
      await fetchContractors({}, state.pagination.page + 1);
    }
  }, [
    state.pagination.page,
    state.pagination.totalPages,
    state.isLoading,
    fetchContractors,
  ]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      contractors: [],
      currentContractor: null,
      filters: {},
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      error: null,
    }));
  }, []);

  // Load contractors and featured contractors on mount
  useEffect(() => {
    fetchContractors();
    fetchFeaturedContractors();
  }, []); // Remove dependencies to prevent infinite loops

  return {
    ...state,
    fetchContractors,
    searchContractors,
    fetchFeaturedContractors,
    fetchContractorDetails,
    setViewMode,
    updateFilters,
    loadMore,
    clearError,
    reset,
  };
}
