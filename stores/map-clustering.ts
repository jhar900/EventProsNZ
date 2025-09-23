/**
 * Map Clustering Store
 * Zustand store for map clustering state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MapContractor } from '@/lib/maps/map-service';
import {
  MapCluster,
  clusterService,
  ClusteringConfig,
  PinFilters,
} from '@/lib/maps/clustering/cluster-service';
import { pinService } from '@/lib/maps/clustering/pin-service';
import { animationService } from '@/lib/maps/clustering/animation-service';

export interface MapClusteringStore {
  // State
  clusters: MapCluster[];
  selectedCluster: MapCluster | null;
  selectedPin: string | null;
  hoveredPin: string | null;
  expandedClusters: Set<string>;
  filters: PinFilters;
  isAnimating: boolean;
  clusteringConfig: ClusteringConfig;
  contractors: MapContractor[];
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  // Actions
  setContractors: (contractors: MapContractor[]) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  setFilters: (filters: PinFilters) => void;
  selectCluster: (cluster: MapCluster | null) => void;
  selectPin: (pinId: string | null) => void;
  hoverPin: (pinId: string | null) => void;
  expandCluster: (clusterId: string) => void;
  collapseCluster: (clusterId: string) => void;
  collapseAllClusters: () => void;
  updateClusteringConfig: (config: Partial<ClusteringConfig>) => void;
  clearAllSelections: () => void;
  refreshClusters: () => void;
  reset: () => void;
}

export const useMapClusteringStore = create<MapClusteringStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      clusters: [],
      selectedCluster: null,
      selectedPin: null,
      hoveredPin: null,
      expandedClusters: new Set(),
      filters: {},
      isAnimating: false,
      clusteringConfig: clusterService.getConfig(),
      contractors: [],
      zoom: 5,
      bounds: {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      },

      // Actions
      setContractors: (contractors: MapContractor[]) => {
        set({ contractors });
        get().refreshClusters();
      },

      setZoom: (zoom: number) => {
        set({ zoom });
        get().refreshClusters();
      },

      setBounds: (bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      }) => {
        set({ bounds });
        get().refreshClusters();
      },

      setFilters: (filters: PinFilters) => {
        set({ filters });
        get().refreshClusters();
      },

      selectCluster: (cluster: MapCluster | null) => {
        set({ selectedCluster: cluster });

        if (cluster) {
          // Clear pin selection when cluster is selected
          set({ selectedPin: null });
          pinService.clearAllSelections();
        }
      },

      selectPin: (pinId: string | null) => {
        set({ selectedPin: pinId });

        if (pinId) {
          pinService.selectPin(pinId);
          // Clear cluster selection when pin is selected
          set({ selectedCluster: null });
        } else {
          pinService.deselectPin(get().selectedPin || '');
        }
      },

      hoverPin: (pinId: string | null) => {
        set({ hoveredPin: pinId });
      },

      expandCluster: (clusterId: string) => {
        set(state => ({
          expandedClusters: new Set(state.expandedClusters).add(clusterId),
        }));
      },

      collapseCluster: (clusterId: string) => {
        set(state => {
          const newSet = new Set(state.expandedClusters);
          newSet.delete(clusterId);
          return { expandedClusters: newSet };
        });
      },

      collapseAllClusters: () => {
        set({ expandedClusters: new Set() });
      },

      updateClusteringConfig: (config: Partial<ClusteringConfig>) => {
        set(state => ({
          clusteringConfig: { ...state.clusteringConfig, ...config },
        }));
        clusterService.updateConfig(config);
        get().refreshClusters();
      },

      clearAllSelections: () => {
        set({
          selectedCluster: null,
          selectedPin: null,
          hoveredPin: null,
        });
        pinService.clearAllSelections();
      },

      refreshClusters: () => {
        const { contractors, zoom, bounds, filters } = get();

        set({ isAnimating: true });

        // Create new clusters
        const newClusters = clusterService.createClusters(
          contractors,
          zoom,
          bounds,
          filters
        );
        set({ clusters: newClusters });

        // Reset animation state after a short delay
        setTimeout(() => {
          set({ isAnimating: false });
        }, 300);
      },

      reset: () => {
        set({
          clusters: [],
          selectedCluster: null,
          selectedPin: null,
          hoveredPin: null,
          expandedClusters: new Set(),
          filters: {},
          isAnimating: false,
          contractors: [],
          zoom: 5,
          bounds: {
            north: -34.0,
            south: -47.0,
            east: 179.0,
            west: 166.0,
          },
        });

        pinService.reset();
        animationService.stopAllAnimations();
      },
    }),
    {
      name: 'map-clustering-store',
    }
  )
);
