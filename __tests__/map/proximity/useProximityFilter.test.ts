/**
 * Proximity Filter Hook Tests
 * Tests for useProximityFilter hook
 */

import { renderHook, act } from '@testing-library/react';
import { useProximityFilter } from '@/hooks/useProximityFilter';

// Mock proximity service
jest.mock('@/lib/maps/proximity/proximity-service', () => ({
  proximityService: {
    filterContractors: jest.fn(),
    getLocationSuggestions: jest.fn(),
  },
}));

import { proximityService } from '@/lib/maps/proximity/proximity-service';

const mockProximityService = proximityService as jest.Mocked<
  typeof proximityService
>;

describe('useProximityFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProximityFilter());

    expect(result.current.searchLocation).toBeNull();
    expect(result.current.searchRadius).toBe(50);
    expect(result.current.serviceType).toBeNull();
    expect(result.current.verifiedOnly).toBe(false);
    expect(result.current.filteredContractors).toEqual([]);
    expect(result.current.locationSuggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.total).toBe(0);
  });

  it('should set search location', () => {
    const { result } = renderHook(() => useProximityFilter());

    const location = { lat: -36.8485, lng: 174.7633 };

    act(() => {
      result.current.setSearchLocation(location);
    });

    expect(result.current.searchLocation).toEqual(location);
  });

  it('should set search radius', () => {
    const { result } = renderHook(() => useProximityFilter());

    act(() => {
      result.current.setSearchRadius(25);
    });

    expect(result.current.searchRadius).toBe(25);
  });

  it('should set service type', () => {
    const { result } = renderHook(() => useProximityFilter());

    act(() => {
      result.current.setServiceType('catering');
    });

    expect(result.current.serviceType).toBe('catering');
  });

  it('should set verified only', () => {
    const { result } = renderHook(() => useProximityFilter());

    act(() => {
      result.current.setVerifiedOnly(true);
    });

    expect(result.current.verifiedOnly).toBe(true);
  });

  it('should get location suggestions', async () => {
    const mockSuggestions = [
      {
        id: 'suggestion-1',
        name: 'Auckland, New Zealand',
        location: { lat: -36.8485, lng: 174.7633 },
        type: 'city' as const,
        formatted_address: 'Auckland, New Zealand',
      },
    ];

    mockProximityService.getLocationSuggestions.mockResolvedValue(
      mockSuggestions
    );

    const { result } = renderHook(() => useProximityFilter());

    await act(async () => {
      await result.current.getLocationSuggestions('Auckland');
    });

    expect(mockProximityService.getLocationSuggestions).toHaveBeenCalledWith(
      'Auckland'
    );
    expect(result.current.locationSuggestions).toEqual(mockSuggestions);
  });

  it('should filter contractors successfully', async () => {
    const mockContractors = [
      {
        id: 'contractor-1',
        company_name: 'Test Catering Co',
        business_address: '123 Queen Street, Auckland',
        service_type: 'catering',
        location: { lat: -36.8485, lng: 174.7633 },
        is_verified: true,
        subscription_tier: 'professional',
        distance: 5.2,
      },
    ];

    const mockResponse = {
      contractors: mockContractors,
      total: 1,
      location: { lat: -36.8485, lng: 174.7633 },
      radius: 50,
    };

    mockProximityService.filterContractors.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProximityFilter());

    // Set search location first
    act(() => {
      result.current.setSearchLocation({ lat: -36.8485, lng: 174.7633 });
    });

    // Wait for the effect to trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockProximityService.filterContractors).toHaveBeenCalledWith({
      location: { lat: -36.8485, lng: 174.7633 },
      radius: 50,
      serviceType: undefined,
      verifiedOnly: false,
    });

    expect(result.current.filteredContractors).toEqual(mockContractors);
    expect(result.current.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle filter contractors error', async () => {
    const error = new Error('Failed to filter contractors');
    mockProximityService.filterContractors.mockRejectedValue(error);

    const { result } = renderHook(() => useProximityFilter());

    // Set search location first
    act(() => {
      result.current.setSearchLocation({ lat: -36.8485, lng: 174.7633 });
    });

    // Wait for the effect to trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to filter contractors');
    expect(result.current.filteredContractors).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should show error when no search location is set', async () => {
    const { result } = renderHook(() => useProximityFilter());

    await act(async () => {
      await result.current.filterContractors();
    });

    expect(result.current.error).toBe('Please select a search location');
    expect(result.current.filteredContractors).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should clear filters', () => {
    const { result } = renderHook(() => useProximityFilter());

    // Set some values first
    act(() => {
      result.current.setSearchLocation({ lat: -36.8485, lng: 174.7633 });
      result.current.setSearchRadius(25);
      result.current.setServiceType('catering');
      result.current.setVerifiedOnly(true);
    });

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchLocation).toBeNull();
    expect(result.current.searchRadius).toBe(50);
    expect(result.current.serviceType).toBeNull();
    expect(result.current.verifiedOnly).toBe(false);
    expect(result.current.filteredContractors).toEqual([]);
    expect(result.current.locationSuggestions).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.total).toBe(0);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useProximityFilter());

    // Set an error first
    act(() => {
      result.current.setSearchLocation({ lat: -36.8485, lng: 174.7633 });
    });

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should not get suggestions for short queries', async () => {
    const { result } = renderHook(() => useProximityFilter());

    await act(async () => {
      await result.current.getLocationSuggestions('A');
    });

    expect(mockProximityService.getLocationSuggestions).not.toHaveBeenCalled();
    expect(result.current.locationSuggestions).toEqual([]);
  });

  it('should handle location suggestions error', async () => {
    const error = new Error('Failed to get suggestions');
    mockProximityService.getLocationSuggestions.mockRejectedValue(error);

    const { result } = renderHook(() => useProximityFilter());

    await act(async () => {
      await result.current.getLocationSuggestions('Auckland');
    });

    expect(result.current.locationSuggestions).toEqual([]);
  });
});
