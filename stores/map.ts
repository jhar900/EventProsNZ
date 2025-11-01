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

          // Import MAPBOX_CONFIG to get the token
          const { MAPBOX_CONFIG } = await import('@/lib/maps/mapbox-config');

          // Set access token
          const token = MAPBOX_CONFIG.ACCESS_TOKEN;
          if (!token || token === '') {
            throw new Error('Mapbox access token not configured');
          }

          mapboxgl.default.accessToken = token;

          // Ensure container has dimensions - check inline styles FIRST (set by InteractiveMap)
          // Check inline styles first since InteractiveMap sets them explicitly
          let width = 0;
          let height = 0;

          if (container.style.width && container.style.height) {
            width = parseFloat(container.style.width.replace('px', '')) || 0;
            height = parseFloat(container.style.height.replace('px', '')) || 0;
            console.log('initializeMap: Found inline styles:', {
              styleWidth: container.style.width,
              styleHeight: container.style.height,
              parsedWidth: width,
              parsedHeight: height,
            });
          }

          // If no inline styles or they're invalid, check computed dimensions
          if (width === 0 || height === 0) {
            // Force layout recalculation
            container.offsetHeight;
            const rect = container.getBoundingClientRect();
            width =
              rect.width || container.offsetWidth || container.clientWidth || 0;
            height =
              rect.height ||
              container.offsetHeight ||
              container.clientHeight ||
              0;
            console.log('initializeMap: No inline styles, using computed:', {
              width,
              height,
              rectWidth: rect.width,
              rectHeight: rect.height,
            });

            // If we got dimensions from computed, SET THEM AS INLINE STYLES to preserve them
            if (width > 0 && height > 0) {
              container.style.width = `${width}px`;
              container.style.height = `${height}px`;
              // Force layout to ensure styles are applied
              container.offsetHeight;
            }
          }

          // If still no dimensions, try to get from parent and set explicitly
          if ((width === 0 || height === 0) && container.parentElement) {
            // Force parent layout
            container.parentElement.offsetHeight;
            const parentRect = container.parentElement.getBoundingClientRect();
            if (parentRect.width > 0 && parentRect.height > 0) {
              // Set explicit dimensions to preserve them
              container.style.width = `${parentRect.width}px`;
              container.style.height = `${parentRect.height}px`;
              // Force layout again after setting style
              container.offsetHeight;
              // Re-check dimensions
              const newRect = container.getBoundingClientRect();
              width =
                newRect.width ||
                container.offsetWidth ||
                container.clientWidth ||
                0;
              height =
                newRect.height ||
                container.offsetHeight ||
                container.clientHeight ||
                0;
              console.log('initializeMap: Got dimensions from parent:', {
                width,
                height,
                parentWidth: parentRect.width,
                parentHeight: parentRect.height,
              });
            }
          }

          // Final check - if still no dimensions, try using parent dimensions
          if (!width || !height || width === 0 || height === 0) {
            console.warn(
              'Map container has no dimensions in initializeMap, trying parent:',
              {
                width,
                height,
                offsetWidth: container.offsetWidth,
                offsetHeight: container.offsetHeight,
                clientWidth: container.clientWidth,
                clientHeight: container.clientHeight,
                styleWidth: container.style.width,
                styleHeight: container.style.height,
                parentWidth:
                  container.parentElement?.getBoundingClientRect().width,
                parentHeight:
                  container.parentElement?.getBoundingClientRect().height,
              }
            );

            // Try to get dimensions from parent
            if (container.parentElement) {
              const parentRect =
                container.parentElement.getBoundingClientRect();
              if (parentRect.width > 0 && parentRect.height > 0) {
                width = parentRect.width;
                height = parentRect.height;
                // Set dimensions on container from parent
                container.style.width = `${width}px`;
                container.style.height = `${height}px`;
                container.offsetHeight; // Force layout
                console.log('Using parent dimensions:', { width, height });
              }
            }

            // If still no dimensions, use a fallback minimum size
            if (!width || !height || width === 0 || height === 0) {
              // Use minimum viable dimensions
              width = 500;
              height = 400;
              container.style.width = `${width}px`;
              container.style.height = `${height}px`;
              container.offsetHeight; // Force layout
              console.warn('Using fallback dimensions:', { width, height });
            }
          }

          // Re-confirm inline styles are set (critical for preserving dimensions)
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
          // Force layout to ensure styles are applied
          container.offsetHeight;

          console.log('Container dimensions verified:', {
            width,
            height,
            styleWidth: container.style.width,
            styleHeight: container.style.height,
          });

          console.log('Creating map instance with:', {
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 10),
            center: get().center,
            zoom: get().zoom,
            containerWidth: width,
            containerHeight: height,
            containerId: container.id,
            containerClassName: container.className,
            styleWidth: container.style.width,
            styleHeight: container.style.height,
          });

          // Ensure container still has dimensions right before creating map
          const finalCheck = container.getBoundingClientRect();
          let finalWidth =
            finalCheck.width ||
            container.offsetWidth ||
            parseFloat(container.style.width) ||
            width;
          let finalHeight =
            finalCheck.height ||
            container.offsetHeight ||
            parseFloat(container.style.height) ||
            height;

          if (finalWidth === 0 || finalHeight === 0) {
            throw new Error(
              `Container dimensions lost before map creation: width=${finalWidth}, height=${finalHeight}`
            );
          }

          // Re-set dimensions one more time to be absolutely sure
          // CRITICAL: Set dimensions right before creating the map instance
          container.style.width = `${finalWidth}px`;
          container.style.height = `${finalHeight}px`;
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.position = 'relative';
          // Force layout to ensure dimensions are calculated
          container.offsetWidth;
          container.offsetHeight;

          // Double-check dimensions one final time - use fallback if needed
          const finalCheckRect = container.getBoundingClientRect();
          let actualWidth = finalCheckRect.width;
          let actualHeight = finalCheckRect.height;

          if (actualWidth === 0 || actualHeight === 0) {
            console.warn(
              'Container still has no dimensions before map creation, using fallback:',
              {
                width: finalCheckRect.width,
                height: finalCheckRect.height,
                computedFinalWidth: finalWidth,
                computedFinalHeight: finalHeight,
              }
            );
            // Set fallback dimensions - use previously computed values or defaults
            const useWidth = finalWidth > 0 ? finalWidth : 500;
            const useHeight = finalHeight > 0 ? finalHeight : 400;
            actualWidth = useWidth;
            actualHeight = useHeight;
            container.style.width = `${actualWidth}px`;
            container.style.height = `${actualHeight}px`;
            container.offsetWidth;
            container.offsetHeight;
            // Update finalWidth/finalHeight for use in map creation
            finalWidth = actualWidth;
            finalHeight = actualHeight;
          } else {
            // Update finalWidth/finalHeight to match actual dimensions
            finalWidth = actualWidth;
            finalHeight = actualHeight;
          }

          // Create map instance - similar to /maps-demo
          const map = new mapboxgl.default.Map({
            container,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: get().center,
            zoom: get().zoom,
            maxBounds: [
              [166.0, -47.0], // West, South
              [179.0, -34.0], // East, North
            ],
            // Ensure map doesn't initialize with invalid dimensions
            preserveDrawingBuffer: true,
          });

          // IMPORTANT: After map creation, Mapbox modifies the container structure
          // We need to ensure dimensions are maintained on the actual map container
          const mapContainer = map.getContainer();

          // The map container might be the same element or a child
          // Ensure both the original container and map container have dimensions
          if (container && container !== mapContainer) {
            container.style.width = `${finalWidth}px`;
            container.style.height = `${finalHeight}px`;
            container.style.position = 'relative';
            container.style.overflow = 'hidden';
          }

          // Always set dimensions on Mapbox's actual container
          if (mapContainer) {
            mapContainer.style.width = `${finalWidth}px`;
            mapContainer.style.height = `${finalHeight}px`;
            mapContainer.style.position = 'relative';
            mapContainer.style.display = 'block';
            // Force layout calculation
            mapContainer.offsetHeight;

            // Also check and set parent if it exists and needs dimensions
            let parent = mapContainer.parentElement;
            let depth = 0;
            while (parent && depth < 3) {
              // Ensure parent also has proper dimensions
              if (
                parent !== document.body &&
                parent !== document.documentElement
              ) {
                const parentRect = parent.getBoundingClientRect();
                if (parentRect.width === 0 || parentRect.height === 0) {
                  // Try to get dimensions from computed styles or set minimum
                  const computedStyle = window.getComputedStyle(parent);
                  if (!computedStyle.width || computedStyle.width === '0px') {
                    parent.style.width = `${finalWidth}px`;
                  }
                  if (!computedStyle.height || computedStyle.height === '0px') {
                    parent.style.height = `${finalHeight}px`;
                  }
                  parent.style.position = 'relative';
                  parent.offsetHeight; // Force layout
                }
              }
              parent = parent.parentElement;
              depth++;
            }
          }

          // Force an immediate resize after setting all dimensions
          requestAnimationFrame(() => {
            if (map && mapContainer) {
              const checkRect = mapContainer.getBoundingClientRect();
              if (checkRect.width === 0 || checkRect.height === 0) {
                // Dimensions still lost, re-apply aggressively
                mapContainer.style.width = `${finalWidth}px`;
                mapContainer.style.height = `${finalHeight}px`;
                mapContainer.style.minWidth = `${finalWidth}px`;
                mapContainer.style.minHeight = `${finalHeight}px`;
                mapContainer.offsetHeight;
                map.resize();
              }
            }
          });

          console.log('Map instance created:', {
            loaded: map.loaded(),
            container: map.getContainer(),
            containerId: map.getContainer()?.id,
            containerWidth: map.getContainer()?.offsetWidth,
            containerHeight: map.getContainer()?.offsetHeight,
            containerStyleWidth: map.getContainer()?.style.width,
            containerStyleHeight: map.getContainer()?.style.height,
            originalContainerWidth: finalWidth,
            originalContainerHeight: finalHeight,
          });

          // Force resize immediately - the map needs to know its container size
          // This must happen synchronously after setting dimensions
          requestAnimationFrame(() => {
            if (map) {
              map.resize();
              console.log('Forcing map resize (RAF)...', {
                loaded: map.loaded(),
                containerWidth: map.getContainer()?.offsetWidth,
                containerHeight: map.getContainer()?.offsetHeight,
              });
            }
          });

          // Force resize again after a short delay
          setTimeout(() => {
            if (map) {
              // Re-check and set dimensions again
              const mapContainer = map.getContainer();
              if (
                mapContainer &&
                (mapContainer.offsetWidth === 0 ||
                  mapContainer.offsetHeight === 0)
              ) {
                mapContainer.style.width = `${finalWidth}px`;
                mapContainer.style.height = `${finalHeight}px`;
                mapContainer.offsetHeight; // Force layout
              }
              map.resize();
              console.log('Forcing map resize (delayed)...', {
                loaded: map.loaded(),
                containerWidth: map.getContainer()?.offsetWidth,
                containerHeight: map.getContainer()?.offsetHeight,
              });
            }
          }, 100);

          // Force resize once more after map loads
          setTimeout(() => {
            if (map) {
              map.resize();
              console.log('Forcing map resize (after delay)...', {
                loaded: map.loaded(),
                containerWidth: map.getContainer()?.offsetWidth,
                containerHeight: map.getContainer()?.offsetHeight,
              });
            }
          }, 300);

          // Handle map errors
          map.on('error', (e: any) => {
            console.error('Map error:', e.error || e);
            const errorMessage = e.error?.message || 'Map rendering error';
            set({
              error: errorMessage,
              isLoading: false,
            });
          });

          // Wait for map to be ready before adding controls and setting bounds
          map.on('load', () => {
            const mapContainer = map.getContainer();
            console.log('Map loaded successfully', {
              containerWidth: mapContainer?.offsetWidth,
              containerHeight: mapContainer?.offsetHeight,
              styleWidth: mapContainer?.style.width,
              styleHeight: mapContainer?.style.height,
              originalWidth: finalWidth,
              originalHeight: finalHeight,
            });

            // CRITICAL: If dimensions are still 0, aggressively fix them
            if (
              mapContainer &&
              (mapContainer.offsetWidth === 0 ||
                mapContainer.offsetHeight === 0)
            ) {
              console.log(
                'Container dimensions are 0 after load, re-setting aggressively...'
              );

              // Set on map container with min dimensions
              mapContainer.style.width = `${finalWidth}px`;
              mapContainer.style.height = `${finalHeight}px`;
              mapContainer.style.minWidth = `${finalWidth}px`;
              mapContainer.style.minHeight = `${finalHeight}px`;
              mapContainer.style.position = 'relative';
              mapContainer.style.display = 'block';

              // Walk up the parent chain and fix all parents
              let parent = mapContainer.parentElement;
              let depth = 0;
              while (parent && depth < 5) {
                if (
                  parent !== document.body &&
                  parent !== document.documentElement
                ) {
                  const parentRect = parent.getBoundingClientRect();
                  if (parentRect.width === 0 || parentRect.height === 0) {
                    parent.style.width = `${finalWidth}px`;
                    parent.style.height = `${finalHeight}px`;
                    parent.style.minWidth = `${finalWidth}px`;
                    parent.style.minHeight = `${finalHeight}px`;
                    parent.style.position = 'relative';
                  }
                  parent.offsetHeight; // Force layout
                }
                parent = parent.parentElement;
                depth++;
              }

              // Force layout on map container
              mapContainer.offsetWidth;
              mapContainer.offsetHeight;

              // Force a resize immediately
              map.resize();
            }

            // Force multiple resizes to ensure map renders correctly
            // Use both RAF and timeouts to catch all rendering cycles
            requestAnimationFrame(() => {
              if (map) {
                const container = map.getContainer();
                if (
                  container &&
                  (container.offsetWidth === 0 || container.offsetHeight === 0)
                ) {
                  container.style.width = `${finalWidth}px`;
                  container.style.height = `${finalHeight}px`;
                  container.offsetHeight;
                }
                map.resize();
                console.log('First resize after load (RAF)');
              }
            });

            setTimeout(() => {
              if (map) {
                map.resize();
                console.log('Second resize after load');
              }
            }, 50);

            setTimeout(() => {
              if (map) {
                map.resize();
                console.log('Third resize after load');
              }
            }, 150);

            setTimeout(() => {
              if (map) {
                map.resize();
                console.log('Fourth resize after load');
              }
            }, 300);

            setTimeout(() => {
              if (map) {
                map.resize();
                console.log('Fifth resize after load (final)');
              }
            }, 600);

            // Add navigation controls after map loads
            try {
              map.addControl(
                new mapboxgl.default.NavigationControl(),
                'top-right'
              );

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
            } catch (controlError) {
              console.warn('Could not add map controls:', controlError);
            }

            // Set initial bounds after map loads
            try {
              map.fitBounds(
                [
                  [get().bounds.west, get().bounds.south],
                  [get().bounds.east, get().bounds.north],
                ],
                { padding: 50 }
              );

              // Load contractors after bounds are set
              setTimeout(() => {
                const bounds = map.getBounds();
                const mapBounds: MapBounds = {
                  north: bounds.getNorth(),
                  south: bounds.getSouth(),
                  east: bounds.getEast(),
                  west: bounds.getWest(),
                };
                console.log(
                  'Loading contractors after fitBounds, bounds:',
                  mapBounds
                );
                get().loadContractors(mapBounds);
              }, 100);
            } catch (boundsError) {
              console.warn('Could not set initial bounds:', boundsError);
              // Still try to load contractors even if fitBounds fails
              const bounds = map.getBounds();
              const mapBounds: MapBounds = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              };
              console.log(
                'Loading contractors after fitBounds error, bounds:',
                mapBounds
              );
              get().loadContractors(mapBounds);
            }
          });

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

          // Set map instance immediately (controls will be added on load)
          set({
            mapInstance: map,
            isLoading: false,
            error: null,
          });
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
          // Handle search error silently
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
          // Handle cache stats error silently
        }
      },

      clearCache: async () => {
        try {
          await mapCacheService.clearCache();
          await get().updateCacheStats();
        } catch (error) {
          // Handle cache clear error silently
        }
      },

      cleanupExpiredTiles: async () => {
        try {
          const cleanedCount = await mapCacheService.cleanupExpiredTiles();
          await get().updateCacheStats();
          return cleanedCount;
        } catch (error) {
          // Handle cleanup error silently
          return 0;
        }
      },
    }),
    {
      name: 'map-store',
    }
  )
);
