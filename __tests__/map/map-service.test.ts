/**
 * Map Service Tests
 * Tests for map data operations and contractor location management
 */

import { mapService, MapBounds, MapFilters } from '@/lib/maps/map-service';

// Mock fetch
global.fetch = jest.fn();

describe('MapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContractors', () => {
    it('should fetch contractors within bounds', async () => {
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

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contractors: mockContractors }),
      });

      const bounds: MapBounds = {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      };

      const result = await mapService.getContractors(bounds);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map/contractors')
      );
      expect(result).toEqual(mockContractors);
    });

    it('should apply filters when provided', async () => {
      const filters: MapFilters = {
        service_type: 'catering',
        verified_only: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contractors: [] }),
      });

      const bounds: MapBounds = {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      };

      await mapService.getContractors(bounds, filters);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('service_type=catering')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('verified_only=true')
      );
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const bounds: MapBounds = {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      };

      await expect(mapService.getContractors(bounds)).rejects.toThrow(
        'Failed to fetch contractors: Internal Server Error'
      );
    });
  });

  describe('getContractorLocation', () => {
    it('should fetch contractor location', async () => {
      const mockLocation = {
        location: { lat: -36.8485, lng: 174.7633 },
        address: '123 Queen St, Auckland',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocation,
      });

      const result = await mapService.getContractorLocation('contractor-1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/map/contractors/contractor-1/location'
      );
      expect(result).toEqual(mockLocation);
    });
  });

  describe('searchMap', () => {
    it('should search for locations and contractors', async () => {
      const mockResults = [
        {
          id: '1',
          name: 'Test Catering',
          location: { lat: -36.8485, lng: 174.7633 },
          type: 'contractor',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockResults }),
      });

      const result = await mapService.searchMap('catering');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map/search')
      );
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=catering'));
      expect(result).toEqual(mockResults);
    });

    it('should include bounds in search when provided', async () => {
      const bounds: MapBounds = {
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await mapService.searchMap('test', bounds);

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('north=-34'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('south=-47'));
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode an address to coordinates', async () => {
      const mockResponse = {
        features: [
          {
            center: [174.7633, -36.8485],
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mapService.geocodeAddress('123 Queen St, Auckland');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('geocoding/v5/mapbox.places')
      );
      expect(result).toEqual({ lat: -36.8485, lng: 174.7633 });
    });

    it('should return null when no results found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] }),
      });

      const result = await mapService.geocodeAddress('invalid address');

      expect(result).toBeNull();
    });
  });

  describe('isWithinNZBounds', () => {
    it('should return true for coordinates within New Zealand', () => {
      const location = { lat: -36.8485, lng: 174.7633 }; // Auckland
      expect(mapService.isWithinNZBounds(location)).toBe(true);
    });

    it('should return false for coordinates outside New Zealand', () => {
      const location = { lat: 40.7128, lng: -74.006 }; // New York
      expect(mapService.isWithinNZBounds(location)).toBe(false);
    });
  });

  describe('getNZBounds', () => {
    it('should return New Zealand bounds', () => {
      const bounds = mapService.getNZBounds();
      expect(bounds).toEqual({
        north: -34.0,
        south: -47.0,
        east: 179.0,
        west: 166.0,
      });
    });
  });
});
