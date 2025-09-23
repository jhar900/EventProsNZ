/**
 * Map Hook
 * Custom hook for map state management and data fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  mapService,
  MapContractor,
  MapBounds,
  MapFilters,
  MapSearchResult,
} from '@/lib/maps/map-service';
import { mapCacheService } from '@/lib/maps/cache-service';

export interface MapState {
  contractors: MapContractor[];
  bounds: MapBounds;
  zoom: number;
  center: [number, number];
  selectedContractor: string | null;
  filters: MapFilters;
  isOffline: boolean;
  isLoading: boolean;
  error: string | null;
  searchResults: MapSearchResult[];
}

export interface MapActions {
  setBounds: (bounds: MapBounds) => void;
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
  setFilters: (filters: MapFilters) => void;
  selectContractor: (contractorId: string | null) => void;
  searchMap: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshContractors: () => Promise<void>;
  clearError: () => void;
}

export function useMap(initialBounds?: MapBounds) {
  const [state, setState] = useState<MapState>({
    contractors: [],
    bounds: initialBounds || mapService.getNZBounds(),
    zoom: 5,
    center: [174.886, -40.9006], // New Zealand center
    selectedContractor: null,
    filters: {},
    isOffline: false,
    isLoading: false,
    error: null,
    searchResults: [],
  });

  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Check offline status
  useEffect(() => {
    const isOffline = mapCacheService.isOffline();
    setState(prev => ({ ...prev, isOffline }));

    const cleanup = mapCacheService.onConnectionChange(isOnline => {
      setState(prev => ({ ...prev, isOffline: !isOnline }));
    });

    return cleanup;
  }, []);

  // Load contractors when bounds or filters change
  const loadContractors = useCallback(
    async (bounds: MapBounds, filters: MapFilters) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const contractors = await mapService.getContractors(bounds, filters);
        setState(prev => ({ ...prev, contractors, isLoading: false }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load contractors';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    []
  );

  // Debounced search function
  const searchMap = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setState(prev => ({ ...prev, searchResults: [] }));
        return;
      }

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await mapService.searchMap(query, state.bounds);
          setState(prev => ({ ...prev, searchResults: results }));
        } catch (error) {
          console.error('Search error:', error);
          setState(prev => ({ ...prev, searchResults: [] }));
        }
      }, 300);
    },
    [state.bounds]
  );

  // Actions
  const setBounds = useCallback(
    (bounds: MapBounds) => {
      setState(prev => ({ ...prev, bounds }));
      loadContractors(bounds, state.filters);
    },
    [loadContractors, state.filters]
  );

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom }));
  }, []);

  const setCenter = useCallback((center: [number, number]) => {
    setState(prev => ({ ...prev, center }));
  }, []);

  const setFilters = useCallback(
    (filters: MapFilters) => {
      setState(prev => ({ ...prev, filters }));
      loadContractors(state.bounds, filters);
    },
    [loadContractors, state.bounds]
  );

  const selectContractor = useCallback((contractorId: string | null) => {
    setState(prev => ({ ...prev, selectedContractor: contractorId }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [] }));
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const refreshContractors = useCallback(async () => {
    await loadContractors(state.bounds, state.filters);
  }, [loadContractors, state.bounds, state.filters]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load initial contractors
  useEffect(() => {
    loadContractors(state.bounds, state.filters);
  }, []); // Only run once on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const actions: MapActions = {
    setBounds,
    setZoom,
    setCenter,
    setFilters,
    selectContractor,
    searchMap,
    clearSearch,
    refreshContractors,
    clearError,
  };

  return { ...state, ...actions };
}
