/**
 * Map API Tests
 * Tests for map API endpoints
 */

import { NextRequest } from 'next/server';
import { GET as getContractors } from '@/app/api/map/contractors/route';
import { GET as getContractorLocation } from '@/app/api/map/contractors/[id]/location/route';
import { GET as searchMap } from '@/app/api/map/search/route';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

// Mock Supabase
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

// Mock map service
jest.mock('@/lib/maps/map-service');
const mockMapService = mapService as jest.Mocked<typeof mapService>;

describe('Map API Endpoints', () => {
  let mockQueryChain: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a proper mock query chain that matches Supabase structure
    mockQueryChain = {
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    // Make sure all methods return the same chain object
    Object.keys(mockQueryChain).forEach(key => {
      mockQueryChain[key].mockReturnValue(mockQueryChain);
    });

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => mockQueryChain),
      })),
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Mock geocoding to return default Auckland coordinates
    mockMapService.geocodeAddress.mockResolvedValue({
      lat: -36.8485,
      lng: 174.7633,
    });
  });

  describe('GET /api/map/contractors', () => {
    it('should return contractors within bounds', async () => {
      const mockContractors = [
        {
          user_id: '1',
          company_name: 'Test Catering',
          business_address: '123 Queen St, Auckland',
          is_verified: true,
          subscription_tier: 'professional',
          users: { id: '1', role: 'contractor' },
          services: [
            { service_type: 'catering', description: 'Catering services' },
          ],
        },
      ];

      // Mock the final query result
      mockQueryChain.eq.mockResolvedValue({
        data: mockContractors,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors?north=-34&south=-47&east=179&west=166'
      );

      const response = await getContractors(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toHaveLength(1);
      expect(data.contractors[0]).toMatchObject({
        id: '1',
        company_name: 'Test Catering',
        service_type: 'catering',
        is_verified: true,
      });
    });

    it('should apply service type filter', async () => {
      // Mock the final query result
      mockQueryChain.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors?north=-34&south=-47&east=179&west=166&service_type=catering'
      );

      await getContractors(request);

      expect(mockQueryChain.eq).toHaveBeenCalled();
    });

    it('should apply verified only filter', async () => {
      // Mock the final query result
      mockQueryChain.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors?north=-34&south=-47&east=179&west=166&verified_only=true'
      );

      await getContractors(request);

      expect(mockQueryChain.eq).toHaveBeenCalled();
    });

    it('should return 400 for invalid bounds', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors'
      );

      const response = await getContractors(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid map bounds provided');
    });

    it('should handle database errors', async () => {
      // Mock the final query result with error
      mockQueryChain.eq.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors?north=-34&south=-47&east=179&west=166'
      );

      const response = await getContractors(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch contractors');
    });
  });

  describe('GET /api/map/contractors/[id]/location', () => {
    it('should return contractor location', async () => {
      const mockContractor = {
        user_id: '1',
        company_name: 'Test Catering',
        business_address: '123 Queen St, Auckland',
        users: { id: '1', role: 'contractor' },
      };

      // Mock the final query result
      mockQueryChain.single.mockResolvedValue({
        data: mockContractor,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors/1/location'
      );

      const response = await getContractorLocation(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        location: { lat: -36.8485, lng: 174.7633 },
        address: '123 Queen St, Auckland',
        company_name: 'Test Catering',
      });
    });

    it('should return 404 for non-existent contractor', async () => {
      // Mock the final query result with error
      mockQueryChain.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors/999/location'
      );

      const response = await getContractorLocation(request, {
        params: { id: '999' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Contractor not found');
    });

    it('should return 400 for missing contractor ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors//location'
      );

      const response = await getContractorLocation(request, {
        params: { id: '' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contractor ID is required');
    });
  });

  describe('GET /api/map/search', () => {
    it('should search for contractors', async () => {
      const mockContractors = [
        {
          user_id: '1',
          company_name: 'Test Catering',
          business_address: '123 Queen St, Auckland',
          users: { id: '1', role: 'contractor' },
          services: [{ service_type: 'catering' }],
        },
      ];

      // Mock the final query result
      mockQueryChain.limit.mockResolvedValue({
        data: mockContractors,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/search?q=catering'
      );

      const response = await searchMap(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(3); // 1 contractor + 2 mock results
      expect(data.results[0]).toMatchObject({
        id: '1',
        name: 'Test Catering',
        type: 'contractor',
      });
    });

    it('should return empty results for short queries', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/search?q=a'
      );

      const response = await searchMap(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });

    it('should include bounds in search', async () => {
      // Mock the final query result
      mockQueryChain.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/search?q=catering&north=-34&south=-47&east=179&west=166'
      );

      await searchMap(request);

      expect(mockQueryChain.limit).toHaveBeenCalled();
    });

    it('should handle search errors gracefully', async () => {
      // Mock the final query result with error
      mockQueryChain.limit.mockResolvedValue({
        data: null,
        error: new Error('Search error'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/search?q=catering'
      );

      const response = await searchMap(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2); // Only mock results, no contractors
    });
  });
});
