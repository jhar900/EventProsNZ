/**
 * Proximity API Tests
 * Tests for proximity filtering API endpoints
 */

import { NextRequest } from 'next/server';
import { GET as filterHandler } from '@/app/api/map/proximity/filter/route';
import { GET as suggestionsHandler } from '@/app/api/map/proximity/suggestions/route';
import { GET as coverageHandler } from '@/app/api/map/proximity/coverage/route';
import { GET as searchHandler } from '@/app/api/map/proximity/search/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          not: jest.fn(() => ({
            or: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: mockContractorData,
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}));

// Mock Map Service
jest.mock('@/lib/maps/map-service', () => ({
  mapService: {
    geocodeAddress: jest.fn(() =>
      Promise.resolve({ lat: -36.8485, lng: 174.7633 })
    ),
  },
}));

// Mock Mapbox Config
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

// Mock contractor data
const mockContractorData = [
  {
    user_id: 'contractor-1',
    company_name: 'Test Catering Co',
    business_address: '123 Queen Street, Auckland',
    is_verified: true,
    subscription_tier: 'professional',
    services: [{ service_type: 'catering' }],
  },
];

describe('Proximity API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/map/proximity/filter', () => {
    it('should filter contractors by proximity', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/filter?lat=-36.8485&lng=174.7633&radius=50'
      );

      const response = await filterHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('contractors');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('radius');
      expect(data.location).toEqual({ lat: -36.8485, lng: 174.7633 });
      expect(data.radius).toBe(50);
    });

    it('should return error for invalid location', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/filter?lat=0&lng=0'
      );

      const response = await filterHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Valid location coordinates required');
    });

    it('should return error for invalid radius', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/filter?lat=-36.8485&lng=174.7633&radius=300'
      );

      const response = await filterHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain(
        'Radius must be between 1 and 200 kilometers'
      );
    });

    it('should filter by service type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/filter?lat=-36.8485&lng=174.7633&radius=50&service_type=catering'
      );

      const response = await filterHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toBeDefined();
    });

    it('should filter by verified only', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/filter?lat=-36.8485&lng=174.7633&radius=50&verified_only=true'
      );

      const response = await filterHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toBeDefined();
    });
  });

  describe('GET /api/map/proximity/suggestions', () => {
    it('should return location suggestions', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/suggestions?q=Auckland'
      );

      const response = await suggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('query');
      expect(data.query).toBe('Auckland');
    });

    it('should return empty suggestions for short query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/suggestions?q=A'
      );

      const response = await suggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([]);
    });

    it('should handle bounds parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/suggestions?q=Auckland&north=-36.5&south=-37.0&east=175.0&west=174.5'
      );

      const response = await suggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('suggestions');
    });
  });

  describe('GET /api/map/proximity/coverage', () => {
    it('should return service area coverage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/coverage?contractor_id=contractor-1'
      );

      const response = await coverageHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('contractor_id');
      expect(data).toHaveProperty('coverage_areas');
      expect(data).toHaveProperty('business_location');
      expect(data.contractor_id).toBe('contractor-1');
    });

    it('should return error for missing contractor ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/coverage'
      );

      const response = await coverageHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Contractor ID is required');
    });

    it('should return error for non-existent contractor', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/coverage?contractor_id=non-existent'
      );

      const response = await coverageHandler(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Contractor not found');
    });
  });

  describe('GET /api/map/proximity/search', () => {
    it('should search contractors with location filtering', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/search?q=catering&lat=-36.8485&lng=174.7633&radius=50'
      );

      const response = await searchHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('radius');
      expect(data.query).toBe('catering');
    });

    it('should search without location filtering', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/search?q=catering'
      );

      const response = await searchHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('query');
      expect(data.query).toBe('catering');
    });

    it('should return empty results for short query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/search?q=c'
      );

      const response = await searchHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should sort results by relevance and distance', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/proximity/search?q=catering&lat=-36.8485&lng=174.7633&radius=50'
      );

      const response = await searchHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      // Results should be sorted by relevance score (higher first)
      if (data.results.length > 1) {
        expect(data.results[0].relevance_score).toBeGreaterThanOrEqual(
          data.results[1].relevance_score
        );
      }
    });
  });
});
