/**
 * useMapClustering Hook Tests
 * Tests for the map clustering hook functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useMapClustering } from '@/hooks/useMapClustering';
import { MapContractor } from '@/lib/maps/map-service';

// Mock the clustering services
jest.mock('@/lib/maps/clustering/cluster-service', () => ({
  clusterService: {
    createClusters: jest.fn(),
    getConfig: jest.fn(() => ({
      clusterRadius: 50,
      clusterMaxZoom: 14,
      clusterMinPoints: 2,
      clusterColor: '#3b82f6',
      clusterTextColor: '#ffffff',
      clusterTextSize: 12,
      maxClusters: 100,
      enableAnimations: true,
    })),
    updateConfig: jest.fn(),
  },
}));

jest.mock('@/lib/maps/clustering/pin-service', () => ({
  pinService: {
    initializePin: jest.fn(),
    selectPin: jest.fn(),
    deselectPin: jest.fn(),
    clearAllSelections: jest.fn(),
    cleanupOldStates: jest.fn(),
    reset: jest.fn(),
  },
}));

jest.mock('@/lib/maps/clustering/animation-service', () => ({
  animationService: {
    isAnyAnimationRunning: jest.fn(() => false),
    stopAllAnimations: jest.fn(),
  },
}));

// Mock contractors for testing
const mockContractors: MapContractor[] = [
  {
    id: '1',
    company_name: 'Test Catering',
    business_address: '123 Main St, Auckland',
    service_type: 'catering',
    location: { lat: -36.8485, lng: 174.7633 },
    is_verified: true,
    subscription_tier: 'premium',
  },
  {
    id: '2',
    company_name: 'Test Photography',
    business_address: '456 Queen St, Auckland',
    service_type: 'photography',
    location: { lat: -36.8486, lng: 174.7634 },
    is_verified: false,
    subscription_tier: 'essential',
  },
];

const mockBounds = {
  north: -36.848,
  south: -36.849,
  east: 174.764,
  west: 174.763,
};

const mockClusters = [
  {
    id: 'cluster-1',
    center: { lat: -36.8485, lng: 174.7633 },
    contractors: mockContractors,
    count: 2,
    bounds: {
      north: -36.8485,
      south: -36.8486,
      east: 174.7634,
      west: 174.7633,
    },
    serviceTypes: ['catering', 'photography'],
    isExpanded: false,
  },
];

describe('useMapClustering', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cluster service to return test clusters based on input
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockImplementation(contractors => {
      // Return clusters based on the contractors passed in
      if (contractors.length === 3) {
        // Return clusters that include the third contractor
        return [
          {
            id: 'cluster-1',
            center: { lat: -36.8485, lng: 174.7633 },
            contractors: contractors,
            count: 3,
            bounds: {
              north: -36.8485,
              south: -36.8487,
              east: 174.7635,
              west: 174.7633,
            },
            serviceTypes: ['catering', 'photography', 'music'],
            averageRating: 4.5,
            hasVerified: true,
          },
        ];
      }
      // Default return for 2 contractors
      return mockClusters;
    });
  });

  const defaultOptions = {
    contractors: mockContractors,
    zoom: 10,
    bounds: mockBounds,
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    expect(result.current.clusters).toEqual(mockClusters);
    expect(result.current.selectedCluster).toBeNull();
    expect(result.current.selectedPin).toBeNull();
    expect(result.current.hoveredPin).toBeNull();
    expect(result.current.expandedClusters).toEqual(new Set());
    expect(result.current.filters).toEqual({});
    expect(result.current.isAnimating).toBe(false);
  });

  it('should initialize with custom options', () => {
    const customOptions = {
      ...defaultOptions,
      initialFilters: { service_type: 'catering' },
      initialConfig: { clusterRadius: 100 },
    };

    const { result } = renderHook(() =>
      useMapClustering(
        customOptions.contractors,
        customOptions.zoom,
        customOptions.bounds,
        customOptions
      )
    );

    expect(result.current.filters).toEqual({ service_type: 'catering' });
    expect(result.current.clusteringConfig.clusterRadius).toBe(100);
  });

  it('should set filters', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    act(() => {
      result.current.setFilters({
        service_type: 'catering',
        verified_only: true,
      });
    });

    expect(result.current.filters).toEqual({
      service_type: 'catering',
      verified_only: true,
    });
  });

  it('should select cluster', () => {
    const mockOnClusterSelect = jest.fn();
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds,
        { onClusterSelect: mockOnClusterSelect }
      )
    );

    act(() => {
      result.current.selectCluster(mockClusters[0]);
    });

    expect(result.current.selectedCluster).toBe(mockClusters[0]);
    expect(mockOnClusterSelect).toHaveBeenCalledWith(mockClusters[0]);
  });

  it('should select pin', () => {
    const mockOnPinSelect = jest.fn();
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds,
        { onPinSelect: mockOnPinSelect }
      )
    );

    act(() => {
      result.current.selectPin('test-pin-1');
    });

    expect(result.current.selectedPin).toBe('test-pin-1');
    expect(mockOnPinSelect).toHaveBeenCalledWith('test-pin-1');
  });

  it('should hover pin', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    act(() => {
      result.current.hoverPin('test-pin-1');
    });

    expect(result.current.hoveredPin).toBe('test-pin-1');
  });

  it('should expand cluster', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    act(() => {
      result.current.expandCluster('cluster-1');
    });

    expect(result.current.expandedClusters).toEqual(new Set(['cluster-1']));
  });

  it('should collapse cluster', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    // First expand
    act(() => {
      result.current.expandCluster('cluster-1');
    });

    // Then collapse
    act(() => {
      result.current.collapseCluster('cluster-1');
    });

    expect(result.current.expandedClusters).toEqual(new Set());
  });

  it('should collapse all clusters', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    // Expand multiple clusters
    act(() => {
      result.current.expandCluster('cluster-1');
      result.current.expandCluster('cluster-2');
    });

    // Collapse all
    act(() => {
      result.current.collapseAllClusters();
    });

    expect(result.current.expandedClusters).toEqual(new Set());
  });

  it('should update clustering configuration', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    act(() => {
      result.current.updateClusteringConfig({
        clusterRadius: 100,
        clusterMaxZoom: 12,
      });
    });

    expect(result.current.clusteringConfig.clusterRadius).toBe(100);
    expect(result.current.clusteringConfig.clusterMaxZoom).toBe(12);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    // Set some selections
    act(() => {
      result.current.selectCluster(mockClusters[0]);
      result.current.selectPin('test-pin-1');
      result.current.hoverPin('test-pin-2');
    });

    // Clear all
    act(() => {
      result.current.clearAllSelections();
    });

    expect(result.current.selectedCluster).toBeNull();
    expect(result.current.selectedPin).toBeNull();
    expect(result.current.hoveredPin).toBeNull();
  });

  it('should refresh clusters when dependencies change', async () => {
    const { result, rerender } = renderHook(
      ({ contractors, zoom, bounds }) =>
        useMapClustering(contractors, zoom, bounds),
      {
        initialProps: defaultOptions,
      }
    );

    const newContractors = [
      ...mockContractors,
      {
        id: '3',
        company_name: 'Test Music',
        business_address: '789 King St, Auckland',
        service_type: 'music',
        location: { lat: -36.8487, lng: 174.7635 },
        is_verified: true,
        subscription_tier: 'professional',
      },
    ];

    // Wait a bit to ensure throttling doesn't interfere
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    rerender({
      contractors: newContractors,
      zoom: defaultOptions.zoom,
      bounds: defaultOptions.bounds,
    });

    // Should call createClusters with new contractors
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    expect(clusterService.createClusters).toHaveBeenLastCalledWith(
      newContractors,
      defaultOptions.zoom,
      defaultOptions.bounds,
      {}
    );
  });

  it('should handle animation state changes', async () => {
    const {
      animationService,
    } = require('@/lib/maps/clustering/animation-service');
    animationService.isAnyAnimationRunning.mockReturnValue(true);

    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    // Wait for the interval to run and update animation state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isAnimating).toBe(true);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    unmount();

    // Should cleanup pin states
    const { pinService } = require('@/lib/maps/clustering/pin-service');
    expect(pinService.cleanupOldStates).toHaveBeenCalled();
  });

  it('should call onFiltersChange when filters change', () => {
    const mockOnFiltersChange = jest.fn();
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds,
        { onFiltersChange: mockOnFiltersChange }
      )
    );

    act(() => {
      result.current.setFilters({ service_type: 'catering' });
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      service_type: 'catering',
    });
  });

  it('should throttle cluster refresh calls', () => {
    const { result } = renderHook(() =>
      useMapClustering(
        defaultOptions.contractors,
        defaultOptions.zoom,
        defaultOptions.bounds
      )
    );

    // Call refresh multiple times rapidly
    act(() => {
      result.current.refreshClusters();
      result.current.refreshClusters();
      result.current.refreshClusters();
    });

    // Should only call createClusters once due to throttling
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    expect(clusterService.createClusters).toHaveBeenCalledTimes(1);
  });
});
