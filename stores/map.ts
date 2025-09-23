/**
 * Map Store
 * Zustand store for map state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  mapService,
  MapContractor,
  MapBounds,
  MapFilters,
  MapSearchResult,
} from '@/lib/maps/map-service';
import { mapCacheService } from '@/lib/maps/cache-service';

export interface MapStore {
  // State
  mapInstance: any | null;
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
  cacheStats: {
    totalTiles: number;
    totalSize: number;
    oldestTile: number;
    newestTile: number;
  };

  // Actions
  initializeMap: (container: HTMLElement) => Promise<void>;
  loadContractors: (bounds: MapBounds) => Promise<void>;
  setFilters: (filters: MapFilters) => void;
  selectContractor: (contractorId: string | null) => void;
  clearSelection: () => void;
  setOfflineMode: (offline: boolean) => void;
  setBounds: (bounds: MapBounds) => void;
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
  searchMap: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshContractors: () => Promise<void>;
  clearError: () => void;
  updateCacheStats: () => Promise<void>;
  clearCache: () => Promise<void>;
  cleanupExpiredTiles: () => Promise<number>;
}

export const useMapStore = create<MapStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      mapInstance: null,
      contractors: [],
      bounds: mapService.getNZBounds(),
      zoom: 5,
      center: [174.886, -40.9006], // New Zealand center
      selectedContractor: null,
      filters: {},
      isOffline: false,
      isLoading: false,
      error: null,
      searchResults: [],
      cacheStats: {
        totalTiles: 0,
        totalSize: 0,
        oldestTile: 0,
        newestTile: 0,
      },

      // Actions
      initializeMap: async (container: HTMLElement) => {
        try {
          set({ isLoading: true, error: null });

          // Check if Mapbox is available
          if (typeof window === 'undefined') {
            throw new Error(
              'Mapbox can only be initialized on the client side'
            );
          }

          // Dynamic import of Mapbox GL JS
          const mapboxgl = await import('mapbox-gl');

          if (!mapboxgl.default) {
            throw new Error('Failed to load Mapbox GL JS');
          }

          // Set access token
          mapboxgl.default.accessToken =
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

          // Create map instance
          const map = new mapboxgl.default.Map({
            container,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: get().center,
            zoom: get().zoom,
            bounds: [
              [get().bounds.west, get().bounds.south],
              [get().bounds.east, get().bounds.north],
            ],
            maxBounds: [
              [166.0, -47.0], // West, South
              [179.0, -34.0], // East, North
            ],
          });

          // Add navigation controls
          map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');

          // Add geolocate control
          map.addControl(
            new mapboxgl.default.GeolocateControl({
              positionOptions: {
                enableHighAccuracy: true,
              },
              trackUserLocation: true,
              showUserHeading: true,
            }),
            'top-right'
          );

          // Set up event listeners
          map.on('moveend', () => {
            const bounds = map.getBounds();
            const newBounds: MapBounds = {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            };

            set({ bounds: newBounds });
            get().loadContractors(newBounds);
          });

          map.on('zoomend', () => {
            set({ zoom: map.getZoom() });
          });

          map.on('move', () => {
            const center = map.getCenter();
            set({ center: [center.lng, center.lat] });
          });

          set({
            mapInstance: map,
            isLoading: false,
            error: null,
          });

          // Load initial contractors
          await get().loadContractors(get().bounds);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to initialize map';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      loadContractors: async (bounds: MapBounds) => {
        try {
          set({ isLoading: true, error: null });

          const contractors = await mapService.getContractors(
            bounds,
            get().filters
          );

          set({
            contractors,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to load contractors';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      setFilters: (filters: MapFilters) => {
        set({ filters });
        get().loadContractors(get().bounds);
      },

      selectContractor: (contractorId: string | null) => {
        set({ selectedContractor: contractorId });
      },

      clearSelection: () => {
        set({ selectedContractor: null });
      },

      setOfflineMode: (offline: boolean) => {
        set({ isOffline: offline });
      },

      setBounds: (bounds: MapBounds) => {
        set({ bounds });
        get().loadContractors(bounds);
      },

      setZoom: (zoom: number) => {
        set({ zoom });
        if (get().mapInstance) {
          get().mapInstance.setZoom(zoom);
        }
      },

      setCenter: (center: [number, number]) => {
        set({ center });
        if (get().mapInstance) {
          get().mapInstance.setCenter(center);
        }
      },

      searchMap: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [] });
          return;
        }

        try {
          const results = await mapService.searchMap(query, get().bounds);
          set({ searchResults: results });
        } catch (error) {
          console.error('Search error:', error);
          set({ searchResults: [] });
        }
      },

      clearSearch: () => {
        set({ searchResults: [] });
      },

      refreshContractors: async () => {
        await get().loadContractors(get().bounds);
      },

      clearError: () => {
        set({ error: null });
      },

      updateCacheStats: async () => {
        try {
          const stats = await mapCacheService.getCacheStats();
          set({ cacheStats: stats });
        } catch (error) {
          console.error('Error updating cache stats:', error);
        }
      },

      clearCache: async () => {
        try {
          await mapCacheService.clearCache();
          await get().updateCacheStats();
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      },

      cleanupExpiredTiles: async () => {
        try {
          const cleanedCount = await mapCacheService.cleanupExpiredTiles();
          await get().updateCacheStats();
          return cleanedCount;
        } catch (error) {
          console.error('Error cleaning up expired tiles:', error);
          return 0;
        }
      },
    }),
    {
      name: 'map-store',
    }
  )
);
