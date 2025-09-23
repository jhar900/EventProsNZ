/**
 * useMap Hook Tests
 * Tests for map state management hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMap } from '@/hooks/useMap';
import { mapService } from '@/lib/maps/map-service';
import { mapCacheService } from '@/lib/maps/cache-service';

// Mock the map service
jest.mock('@/lib/maps/map-service');
const mockMapService = mapService as jest.Mocked<typeof mapService>;

// Mock the cache service
jest.mock('@/lib/maps/cache-service');
const mockMapCacheService = mapCacheService as jest.Mocked<
  typeof mapCacheService
>;

describe('useMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockMapService.getContractors.mockResolvedValue([]);
    mockMapService.searchMap.mockResolvedValue([]);
    mockMapService.getNZBounds.mockReturnValue({
      north: -34.0,
      south: -47.0,
      east: 179.0,
      west: 166.0,
    });

    mockMapCacheService.isOffline.mockReturnValue(false);
    mockMapCacheService.onConnectionChange.mockReturnValue(() => {});
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useMap());

    expect(result.current.contractors).toEqual([]);
    expect(result.current.bounds).toEqual({
      north: -34.0,
      south: -47.0,
      east: 179.0,
      west: 166.0,
    });
    expect(result.current.zoom).toBe(5);
    expect(result.current.center).toEqual([174.886, -40.9006]);
    expect(result.current.selectedContractor).toBeNull();
    expect(result.current.filters).toEqual({});
    expect(result.current.isOffline).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searchResults).toEqual([]);

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should load contractors on mount', async () => {
    const mockContractors = [
      {
        id: '1',
        company_name: 'Test Catering',
        business_address: '123 Queen St, Auckland',
        service_type: 'catering',
        location: { lat: -36.8485, lng: 174.7633 },
        is_verified: true,
        subscription_tier: 'professional',
      },
    ];

    mockMapService.getContractors.mockResolvedValue(mockContractors);

    const { result } = renderHook(() => useMap());

    await act(async () => {
      // Wait for initial load
    });

    expect(mockMapService.getContractors).toHaveBeenCalledWith(
      {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      },
      {}
    );
    expect(result.current.contractors).toEqual(mockContractors);
  });

  it('should handle contractor loading errors', async () => {
    const error = new Error('Failed to load contractors');
    mockMapService.getContractors.mockRejectedValue(error);

    const { result } = renderHook(() => useMap());

    await act(async () => {
      // Wait for initial load
    });

    expect(result.current.error).toBe('Failed to load contractors');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update bounds and reload contractors', async () => {
    const { result } = renderHook(() => useMap());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const newBounds = {
      north: -35.0,
      south: -46.0,
      east: 178.0,
      west: 167.0,
    };

    await act(async () => {
      result.current.setBounds(newBounds);
    });

    expect(result.current.bounds).toEqual(newBounds);
    expect(mockMapService.getContractors).toHaveBeenCalledWith(newBounds, {});
  });

  it('should update filters and reload contractors', async () => {
    const { result } = renderHook(() => useMap());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const filters = {
      service_type: 'catering',
      verified_only: true,
    };

    await act(async () => {
      result.current.setFilters(filters);
    });

    expect(result.current.filters).toEqual(filters);
    expect(mockMapService.getContractors).toHaveBeenCalledWith(
      result.current.bounds,
      filters
    );
  });

  it('should handle contractor selection', () => {
    const { result } = renderHook(() => useMap());

    act(() => {
      result.current.selectContractor('contractor-1');
    });

    expect(result.current.selectedContractor).toBe('contractor-1');

    act(() => {
      result.current.selectContractor(null);
    });

    expect(result.current.selectedContractor).toBeNull();
  });

  it('should handle map search', async () => {
    const mockResults = [
      {
        id: '1',
        name: 'Test Catering',
        location: { lat: -36.8485, lng: 174.7633 },
        type: 'contractor' as const,
      },
    ];

    mockMapService.searchMap.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useMap());

    await act(async () => {
      result.current.searchMap('catering');
    });

    // Wait for debounced search
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(mockMapService.searchMap).toHaveBeenCalledWith(
      'catering',
      result.current.bounds
    );
    expect(result.current.searchResults).toEqual(mockResults);
  });

  it('should clear search results', () => {
    const { result } = renderHook(() => useMap());

    act(() => {
      result.current.searchMap('test');
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchResults).toEqual([]);
  });

  it('should handle offline status changes', () => {
    mockMapCacheService.isOffline.mockReturnValue(true);

    const { result } = renderHook(() => useMap());

    expect(result.current.isOffline).toBe(true);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useMap());

    // Set an error first
    act(() => {
      result.current.setBounds({ north: 0, south: 0, east: 0, west: 0 });
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should refresh contractors', async () => {
    const { result } = renderHook(() => useMap());

    await act(async () => {
      result.current.refreshContractors();
    });

    expect(mockMapService.getContractors).toHaveBeenCalledWith(
      result.current.bounds,
      result.current.filters
    );
  });

  it('should debounce search queries', async () => {
    const { result } = renderHook(() => useMap());

    // Multiple rapid searches
    act(() => {
      result.current.searchMap('a');
    });

    act(() => {
      result.current.searchMap('ab');
    });

    act(() => {
      result.current.searchMap('abc');
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    // Should only call search once with the last query
    expect(mockMapService.searchMap).toHaveBeenCalledTimes(1);
    expect(mockMapService.searchMap).toHaveBeenCalledWith(
      'abc',
      result.current.bounds
    );
  });
});
