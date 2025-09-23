/**
 * Map Clustering Hook
 * Custom hook for managing map clustering state and interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContractor } from '@/lib/maps/map-service';
import {
  MapCluster,
  clusterService,
  ClusteringConfig,
  PinFilters,
} from '@/lib/maps/clustering/cluster-service';
import { pinService } from '@/lib/maps/clustering/pin-service';
import { animationService } from '@/lib/maps/clustering/animation-service';

export interface MapClusteringState {
  clusters: MapCluster[];
  selectedCluster: MapCluster | null;
  selectedPin: string | null;
  hoveredPin: string | null;
  expandedClusters: Set<string>;
  filters: PinFilters;
  isAnimating: boolean;
  clusteringConfig: ClusteringConfig;
}

export interface MapClusteringActions {
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
}

export interface UseMapClusteringOptions {
  initialFilters?: PinFilters;
  initialConfig?: Partial<ClusteringConfig>;
  onClusterSelect?: (cluster: MapCluster) => void;
  onPinSelect?: (pinId: string) => void;
  onFiltersChange?: (filters: PinFilters) => void;
}

export function useMapClustering(
  contractors: MapContractor[],
  zoom: number,
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  options: UseMapClusteringOptions = {}
): MapClusteringState & MapClusteringActions {
  const {
    initialFilters = {},
    initialConfig = {},
    onClusterSelect,
    onPinSelect,
    onFiltersChange,
  } = options;

  // State
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(
    null
  );
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set()
  );
  const [filters, setFiltersState] = useState<PinFilters>(initialFilters);
  const [isAnimating, setIsAnimating] = useState(false);
  const [clusteringConfig, setClusteringConfig] = useState<ClusteringConfig>({
    ...clusterService.getConfig(),
    ...initialConfig,
  });

  // Refs
  const animationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);

  // Update clustering configuration
  const updateClusteringConfig = useCallback(
    (config: Partial<ClusteringConfig>) => {
      setClusteringConfig(prev => ({ ...prev, ...config }));
      clusterService.updateConfig(config);
    },
    []
  );

  // Set filters
  const setFilters = useCallback(
    (newFilters: PinFilters) => {
      setFiltersState(newFilters);
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange]
  );

  // Select cluster
  const selectCluster = useCallback(
    (cluster: MapCluster | null) => {
      setSelectedCluster(cluster);
      onClusterSelect?.(cluster!);
    },
    [onClusterSelect]
  );

  // Select pin
  const selectPin = useCallback(
    (pinId: string | null) => {
      setSelectedPin(pinId);
      if (pinId) {
        pinService.selectPin(pinId);
        onPinSelect?.(pinId);
      } else {
        pinService.deselectPin(selectedPin || '');
      }
    },
    [selectedPin, onPinSelect]
  );

  // Hover pin
  const hoverPin = useCallback((pinId: string | null) => {
    setHoveredPin(pinId);
    if (pinId) {
      // Handle hover logic here
    } else {
      // Handle hover end logic here
    }
  }, []);

  // Expand cluster
  const expandCluster = useCallback((clusterId: string) => {
    setExpandedClusters(prev => new Set(prev).add(clusterId));
  }, []);

  // Collapse cluster
  const collapseCluster = useCallback((clusterId: string) => {
    setExpandedClusters(prev => {
      const newSet = new Set(prev);
      newSet.delete(clusterId);
      return newSet;
    });
  }, []);

  // Collapse all clusters
  const collapseAllClusters = useCallback(() => {
    setExpandedClusters(new Set());
  }, []);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedCluster(null);
    setSelectedPin(null);
    setHoveredPin(null);
    pinService.clearAllSelections();
  }, []);

  // Refresh clusters
  const refreshClusters = useCallback(
    (isInitialLoad = false) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 100) {
        // Throttle updates to prevent excessive re-renders
        return;
      }
      lastUpdateRef.current = now;

      // Only set animation state for non-initial loads
      if (!isInitialLoad) {
        setIsAnimating(true);
      }

      // Clear animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Create new clusters
      const newClusters = clusterService.createClusters(
        contractors,
        zoom,
        bounds,
        filters
      );
      setClusters(newClusters);

      // Reset animation state after a short delay (only for non-initial loads)
      if (!isInitialLoad) {
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }
    },
    [contractors, zoom, bounds, filters]
  );

  // Update clusters when dependencies change
  useEffect(() => {
    refreshClusters(true); // Initial load
  }, [refreshClusters]);

  // Clean up animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Monitor animation service for global animation state
  useEffect(() => {
    const checkAnimations = () => {
      const hasAnimations = animationService.isAnyAnimationRunning();
      if (hasAnimations !== isAnimating) {
        setIsAnimating(hasAnimations);
      }
    };

    const interval = setInterval(checkAnimations, 100);
    return () => clearInterval(interval);
  }, [isAnimating]);

  // Clean up pin states periodically and on unmount
  useEffect(() => {
    const cleanup = setInterval(() => {
      pinService.cleanupOldStates();
    }, 300000); // Clean up every 5 minutes

    return () => {
      clearInterval(cleanup);
      // Clean up immediately on unmount
      pinService.cleanupOldStates();
    };
  }, []);

  return {
    // State
    clusters,
    selectedCluster,
    selectedPin,
    hoveredPin,
    expandedClusters,
    filters,
    isAnimating,
    clusteringConfig,

    // Actions
    setFilters,
    selectCluster,
    selectPin,
    hoverPin,
    expandCluster,
    collapseCluster,
    collapseAllClusters,
    updateClusteringConfig,
    clearAllSelections,
    refreshClusters,
  };
}
