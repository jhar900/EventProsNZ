/**
 * Proximity Filter Hook
 * Manages proximity-based contractor filtering state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  proximityService,
  ProximityFilter,
  ProximityContractor,
  LocationSuggestion,
} from '@/lib/maps/proximity/proximity-service';

export interface ProximityFilterState {
  searchLocation: { lat: number; lng: number } | null;
  searchRadius: number;
  serviceType: string | null;
  verifiedOnly: boolean;
  filteredContractors: ProximityContractor[];
  locationSuggestions: LocationSuggestion[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export interface ProximityFilterActions {
  setSearchLocation: (location: { lat: number; lng: number } | null) => void;
  setSearchRadius: (radius: number) => void;
  setServiceType: (serviceType: string | null) => void;
  setVerifiedOnly: (verifiedOnly: boolean) => void;
  filterContractors: () => Promise<void>;
  getLocationSuggestions: (query: string) => Promise<void>;
  clearFilters: () => void;
  clearError: () => void;
}

export function useProximityFilter(): ProximityFilterState &
  ProximityFilterActions {
  const [state, setState] = useState<ProximityFilterState>({
    searchLocation: null,
    searchRadius: 50, // Default 50km
    serviceType: null,
    verifiedOnly: false,
    filteredContractors: [],
    locationSuggestions: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const setSearchLocation = useCallback(
    (location: { lat: number; lng: number } | null) => {
      setState(prev => ({ ...prev, searchLocation: location }));
    },
    []
  );

  const setSearchRadius = useCallback((radius: number) => {
    setState(prev => ({ ...prev, searchRadius: radius }));
  }, []);

  const setServiceType = useCallback((serviceType: string | null) => {
    setState(prev => ({ ...prev, serviceType }));
  }, []);

  const setVerifiedOnly = useCallback((verifiedOnly: boolean) => {
    setState(prev => ({ ...prev, verifiedOnly }));
  }, []);

  const filterContractors = useCallback(async () => {
    if (!state.searchLocation) {
      setState(prev => ({
        ...prev,
        error: 'Please select a search location',
        filteredContractors: [],
        total: 0,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filter: ProximityFilter = {
        location: state.searchLocation,
        radius: state.searchRadius,
        serviceType: state.serviceType || undefined,
        verifiedOnly: state.verifiedOnly,
      };

      const result = await proximityService.filterContractors(filter);

      setState(prev => ({
        ...prev,
        filteredContractors: result.contractors,
        total: result.total,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to filter contractors',
        filteredContractors: [],
        total: 0,
      }));
    }
  }, [
    state.searchLocation,
    state.searchRadius,
    state.serviceType,
    state.verifiedOnly,
  ]);

  const getLocationSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setState(prev => ({ ...prev, locationSuggestions: [] }));
      return;
    }

    try {
      const suggestions = await proximityService.getLocationSuggestions(
        query.trim()
      );
      setState(prev => ({ ...prev, locationSuggestions: suggestions }));
    } catch (error) {
      setState(prev => ({ ...prev, locationSuggestions: [] }));
    }
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchLocation: null,
      searchRadius: 50,
      serviceType: null,
      verifiedOnly: false,
      filteredContractors: [],
      locationSuggestions: [],
      total: 0,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-filter when location or filters change
  useEffect(() => {
    if (state.searchLocation) {
      filterContractors();
    }
  }, [
    state.searchLocation,
    state.searchRadius,
    state.serviceType,
    state.verifiedOnly,
    filterContractors,
  ]);

  return {
    ...state,
    setSearchLocation,
    setSearchRadius,
    setServiceType,
    setVerifiedOnly,
    filterContractors,
    getLocationSuggestions,
    clearFilters,
    clearError,
  };
}
