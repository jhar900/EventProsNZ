/**
 * Proximity Filter Store
 * Zustand store for proximity filtering state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ProximityContractor,
  LocationSuggestion,
  ServiceArea,
} from '@/lib/maps/proximity/proximity-service';

export interface ProximityFilterStore {
  // State
  searchLocation: { lat: number; lng: number } | null;
  searchRadius: number;
  serviceType: string | null;
  verifiedOnly: boolean;
  filteredContractors: ProximityContractor[];
  locationSuggestions: LocationSuggestion[];
  serviceAreas: ServiceArea[];
  searchHistory: Array<{
    id: string;
    location: { lat: number; lng: number };
    radius: number;
    timestamp: string;
    resultsCount: number;
  }>;
  isLoading: boolean;
  error: string | null;
  total: number;

  // Actions
  setSearchLocation: (location: { lat: number; lng: number } | null) => void;
  setSearchRadius: (radius: number) => void;
  setServiceType: (serviceType: string | null) => void;
  setVerifiedOnly: (verifiedOnly: boolean) => void;
  setFilteredContractors: (contractors: ProximityContractor[]) => void;
  setLocationSuggestions: (suggestions: LocationSuggestion[]) => void;
  setServiceAreas: (areas: ServiceArea[]) => void;
  addToSearchHistory: (search: {
    location: { lat: number; lng: number };
    radius: number;
    resultsCount: number;
  }) => void;
  clearSearchHistory: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  searchLocation: null,
  searchRadius: 50,
  serviceType: null,
  verifiedOnly: false,
  filteredContractors: [],
  locationSuggestions: [],
  serviceAreas: [],
  searchHistory: [],
  isLoading: false,
  error: null,
  total: 0,
};

export const useProximityFilterStore = create<ProximityFilterStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSearchLocation: location =>
        set({ searchLocation: location }, false, 'setSearchLocation'),

      setSearchRadius: radius =>
        set({ searchRadius: radius }, false, 'setSearchRadius'),

      setServiceType: serviceType =>
        set({ serviceType }, false, 'setServiceType'),

      setVerifiedOnly: verifiedOnly =>
        set({ verifiedOnly }, false, 'setVerifiedOnly'),

      setFilteredContractors: contractors =>
        set(
          { filteredContractors: contractors },
          false,
          'setFilteredContractors'
        ),

      setLocationSuggestions: suggestions =>
        set(
          { locationSuggestions: suggestions },
          false,
          'setLocationSuggestions'
        ),

      setServiceAreas: areas =>
        set({ serviceAreas: areas }, false, 'setServiceAreas'),

      addToSearchHistory: search =>
        set(
          state => ({
            searchHistory: [
              {
                id: `search-${Date.now()}`,
                ...search,
                timestamp: new Date().toISOString(),
              },
              ...state.searchHistory.slice(0, 9), // Keep last 10 searches
            ],
          }),
          false,
          'addToSearchHistory'
        ),

      clearSearchHistory: () =>
        set({ searchHistory: [] }, false, 'clearSearchHistory'),

      setLoading: loading => set({ isLoading: loading }, false, 'setLoading'),

      setError: error => set({ error }, false, 'setError'),

      setTotal: total => set({ total }, false, 'setTotal'),

      clearFilters: () =>
        set(
          {
            searchLocation: null,
            searchRadius: 50,
            serviceType: null,
            verifiedOnly: false,
            filteredContractors: [],
            locationSuggestions: [],
            error: null,
            total: 0,
          },
          false,
          'clearFilters'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    {
      name: 'proximity-filter-store',
    }
  )
);
