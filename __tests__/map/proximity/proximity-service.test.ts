/**
 * Proximity Service Tests
 * Tests for proximity service functionality
 */

import { proximityService } from '@/lib/maps/proximity/proximity-service';

// Mock fetch
global.fetch = jest.fn();

// Mock Mapbox config
jest.mock('@/lib/maps/mapbox-config', () => ({
  MAPBOX_CONFIG: {
    ACCESS_TOKEN: 'test-token',
    GEOCODING: {
      country: 'NZ',
      types: 'address,poi,place',
      limit: '10',
    },
  },
}));

describe('ProximityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('filterContractors', () => {
    it('should filter contractors by proximity', async () => {
      const mockResponse = {
        contractors: [
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
        ],
        total: 1,
        location: { lat: -36.8485, lng: 174.7633 },
        radius: 50,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const filter = {
        location: { lat: -36.8485, lng: 174.7633 },
        radius: 50,
        serviceType: 'catering',
        verifiedOnly: true,
      };

      const result = await proximityService.filterContractors(filter);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/map/proximity/filter?lat=-36.8485&lng=174.7633&radius=50&service_type=catering&verified_only=true'
        )
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const filter = {
        location: { lat: -36.8485, lng: 174.7633 },
        radius: 50,
      };

      await expect(proximityService.filterContractors(filter)).rejects.toThrow(
        'Failed to filter contractors: Internal Server Error'
      );
    });
  });

  describe('getLocationSuggestions', () => {
    it('should get location suggestions', async () => {
      const mockResponse = {
        suggestions: [
          {
            id: 'suggestion-1',
            name: 'Auckland, New Zealand',
            location: { lat: -36.8485, lng: 174.7633 },
            type: 'city',
            formatted_address: 'Auckland, New Zealand',
          },
        ],
        query: 'Auckland',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await proximityService.getLocationSuggestions('Auckland');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map/proximity/suggestions?q=Auckland')
      );
      expect(result).toEqual(mockResponse.suggestions);
    });

    it('should handle bounds parameter', async () => {
      const mockResponse = { suggestions: [], query: 'Auckland' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const bounds = {
        north: -36.5,
        south: -37.0,
        east: 175.0,
        west: 174.5,
      };

      await proximityService.getLocationSuggestions('Auckland', bounds);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('north=-36.5&south=-37&east=175&west=174.5')
      );
    });
  });

  describe('getServiceAreaCoverage', () => {
    it('should get service area coverage', async () => {
      const mockResponse = {
        contractor_id: 'contractor-1',
        coverage_areas: [
          {
            id: 'default-radius',
            name: 'Test Catering Co Service Area',
            type: 'radius',
            coordinates: [{ lat: -36.8485, lng: 174.7633 }],
            radius: 50,
            description: 'Primary service area',
          },
        ],
        business_location: { lat: -36.8485, lng: 174.7633 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result =
        await proximityService.getServiceAreaCoverage('contractor-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/map/proximity/coverage?contractor_id=contractor-1'
        )
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchContractors', () => {
    it('should search contractors with location filtering', async () => {
      const mockResponse = {
        results: [
          {
            id: 'contractor-1',
            company_name: 'Test Catering Co',
            business_address: '123 Queen Street, Auckland',
            service_type: 'catering',
            location: { lat: -36.8485, lng: 174.7633 },
            is_verified: true,
            subscription_tier: 'professional',
            distance: 5.2,
            relevance_score: 15,
          },
        ],
        total: 1,
        query: 'catering',
        location: { lat: -36.8485, lng: 174.7633 },
        radius: 50,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await proximityService.searchContractors(
        'catering',
        { lat: -36.8485, lng: 174.7633 },
        50
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/map/proximity/search?q=catering&lat=-36.8485&lng=174.7633&radius=50'
        )
      );
      expect(result).toEqual(mockResponse);
    });

    it('should search without location filtering', async () => {
      const mockResponse = {
        results: [],
        total: 0,
        query: 'catering',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await proximityService.searchContractors('catering');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map/proximity/search?q=catering')
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { lat: -36.8485, lng: 174.7633 }; // Auckland
      const point2 = { lat: -41.2924, lng: 174.7787 }; // Wellington

      const distance = proximityService.calculateDistance(point1, point2);

      // Distance between Auckland and Wellington is approximately 493km
      expect(distance).toBeCloseTo(493, 0);
    });

    it('should return 0 for same points', () => {
      const point = { lat: -36.8485, lng: 174.7633 };

      const distance = proximityService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for point within radius', () => {
      const center = { lat: -36.8485, lng: 174.7633 };
      const point = { lat: -36.8585, lng: 174.7733 }; // ~1km away
      const radius = 10; // 10km

      const isWithin = proximityService.isWithinRadius(center, point, radius);

      expect(isWithin).toBe(true);
    });

    it('should return false for point outside radius', () => {
      const center = { lat: -36.8485, lng: 174.7633 };
      const point = { lat: -41.2924, lng: 174.7787 }; // ~493km away
      const radius = 10; // 10km

      const isWithin = proximityService.isWithinRadius(center, point, radius);

      expect(isWithin).toBe(false);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters for short distances', () => {
      const distance = 0.5; // 500m
      const formatted = proximityService.formatDistance(distance);

      expect(formatted).toBe('500m');
    });

    it('should format distance in kilometers for longer distances', () => {
      const distance = 5.2; // 5.2km
      const formatted = proximityService.formatDistance(distance);

      expect(formatted).toBe('5.2km');
    });

    it('should round to 1 decimal place', () => {
      const distance = 5.234; // 5.234km
      const formatted = proximityService.formatDistance(distance);

      expect(formatted).toBe('5.2km');
    });
  });

  describe('getRadiusOptions', () => {
    it('should return radius options', () => {
      const options = proximityService.getRadiusOptions();

      expect(options).toEqual([
        { value: 10, label: '10km' },
        { value: 25, label: '25km' },
        { value: 50, label: '50km' },
        { value: 100, label: '100km' },
        { value: 200, label: '200km' },
      ]);
    });
  });
});
