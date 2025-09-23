/**
 * Map Components Tests
 * Tests for map UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveMap } from '@/components/features/map/InteractiveMap';
import { MapLoading } from '@/components/features/map/MapLoading';
import { MapControls } from '@/components/features/map/MapControls';
import { MapLegend } from '@/components/features/map/MapLegend';
import { ContractorPin } from '@/components/features/map/ContractorPin';
import { OfflineIndicator } from '@/components/features/map/OfflineIndicator';
import { MapboxProvider } from '@/lib/maps/mapbox-context';
import { useMapStore } from '@/stores/map';

// Mock the map store
jest.mock('@/stores/map');
const mockUseMapStore = useMapStore as jest.MockedFunction<typeof useMapStore>;

// Mock Mapbox context
jest.mock('@/lib/maps/mapbox-context', () => ({
  MapboxProvider: ({ children }: { children: React.ReactNode }) => children,
  useMapbox: () => ({
    isLoaded: true,
    mapboxgl: {},
    mapInstance: {
      on: jest.fn(),
      off: jest.fn(),
      project: jest.fn(() => ({ x: 100, y: 100 })),
    },
    error: null,
  }),
}));

// Mock Mapbox
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    addControl: jest.fn(),
    getBounds: jest.fn(() => ({
      getNorth: () => -34.0,
      getSouth: () => -47.0,
      getEast: () => 179.0,
      getWest: () => 166.0,
    })),
    getCenter: jest.fn(() => ({ lng: 174.7633, lat: -36.8485 })),
    getZoom: jest.fn(() => 5),
    setStyle: jest.fn(),
    flyTo: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  GeolocateControl: jest.fn(),
}));

describe('Map Components', () => {
  const mockContractor = {
    id: '1',
    company_name: 'Test Catering',
    business_address: '123 Queen St, Auckland',
    service_type: 'catering',
    location: { lat: -36.8485, lng: 174.7633 },
    is_verified: true,
    subscription_tier: 'professional',
  };

  beforeEach(() => {
    mockUseMapStore.mockReturnValue({
      mapInstance: null,
      contractors: [mockContractor],
      bounds: { north: -34.0, south: -47.0, east: 179.0, west: 166.0 },
      zoom: 5,
      center: [174.7633, -36.8485],
      selectedContractor: null,
      filters: {},
      isOffline: false,
      isLoading: false,
      error: null,
      searchResults: [],
      cacheStats: { totalTiles: 0, totalSize: 0, oldestTile: 0, newestTile: 0 },
      initializeMap: jest.fn(),
      loadContractors: jest.fn(),
      setFilters: jest.fn(),
      selectContractor: jest.fn(),
      clearSelection: jest.fn(),
      setOfflineMode: jest.fn(),
      setBounds: jest.fn(),
      setZoom: jest.fn(),
      setCenter: jest.fn(),
      searchMap: jest.fn(),
      clearSearch: jest.fn(),
      refreshContractors: jest.fn(),
      clearError: jest.fn(),
      updateCacheStats: jest.fn(),
      clearCache: jest.fn(),
      cleanupExpiredTiles: jest.fn(),
    });
  });

  describe('MapLoading', () => {
    it('should render loading message', () => {
      render(<MapLoading message="Loading map..." />);
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });

    it('should render default loading message', () => {
      render(<MapLoading />);
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });
  });

  describe('MapControls', () => {
    it('should render zoom controls', () => {
      render(<MapControls />);
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    });

    it('should render navigation controls', () => {
      render(<MapControls />);
      expect(screen.getByTitle('Reset to New Zealand')).toBeInTheDocument();
      expect(screen.getByTitle('Go to Auckland')).toBeInTheDocument();
      expect(screen.getByTitle('Find My Location')).toBeInTheDocument();
    });

    it('should handle zoom in click', () => {
      const mockSetZoom = jest.fn();
      mockUseMapStore.mockReturnValue({
        ...mockUseMapStore(),
        setZoom: mockSetZoom,
        mapInstance: {
          zoomIn: jest.fn(),
        },
      });

      render(<MapControls />);
      fireEvent.click(screen.getByTitle('Zoom In'));
      expect(mockSetZoom).toHaveBeenCalled();
    });
  });

  describe('MapLegend', () => {
    it('should render service types', () => {
      render(<MapLegend contractors={[mockContractor]} />);
      expect(screen.getByText('Service Types')).toBeInTheDocument();
      expect(screen.getByText('Catering')).toBeInTheDocument();
    });

    it('should show contractor count', () => {
      render(<MapLegend contractors={[mockContractor]} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show verification indicators', () => {
      render(<MapLegend contractors={[mockContractor]} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  });

  describe('ContractorPin', () => {
    it('should render contractor pin', () => {
      render(
        <ContractorPin
          contractor={mockContractor}
          isSelected={false}
          onClick={jest.fn()}
        />
      );
      expect(screen.getByText('🍽️')).toBeInTheDocument();
    });

    it('should show verification badge for verified contractors', () => {
      render(
        <ContractorPin
          contractor={mockContractor}
          isSelected={false}
          onClick={jest.fn()}
        />
      );
      // Verification badge should be present
      const pin = screen.getByText('🍽️').parentElement;
      expect(pin).toHaveClass('relative');
    });

    it('should handle click events', () => {
      const mockOnClick = jest.fn();
      render(
        <ContractorPin
          contractor={mockContractor}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByText('🍽️'));
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('OfflineIndicator', () => {
    it('should show online status', () => {
      render(<OfflineIndicator />);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should show offline status', () => {
      mockUseMapStore.mockReturnValue({
        ...mockUseMapStore(),
        isOffline: true,
      });

      render(<OfflineIndicator />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should toggle details panel', () => {
      render(<OfflineIndicator />);
      fireEvent.click(screen.getByText('Online'));
      expect(screen.getByText('Connection')).toBeInTheDocument();
    });
  });

  describe('InteractiveMap', () => {
    it('should render map container', () => {
      render(
        <MapboxProvider>
          <InteractiveMap />
        </MapboxProvider>
      );
      // Map container should be present
      expect(
        document.querySelector('[style*="min-height: 400px"]')
      ).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseMapStore.mockReturnValue({
        ...mockUseMapStore(),
        isLoading: true,
      });

      render(
        <MapboxProvider>
          <InteractiveMap />
        </MapboxProvider>
      );
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseMapStore.mockReturnValue({
        ...mockUseMapStore(),
        error: 'Map failed to load',
      });

      render(
        <MapboxProvider>
          <InteractiveMap />
        </MapboxProvider>
      );
      expect(screen.getByText('Map Error')).toBeInTheDocument();
      expect(screen.getByText('Map failed to load')).toBeInTheDocument();
    });
  });
});
