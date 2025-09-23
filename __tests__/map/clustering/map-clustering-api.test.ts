/**
 * Map Clustering API Tests
 * Tests for the map clustering API endpoints
 */

// Mock NextRequest BEFORE importing the API routes
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(input, init) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }

    async json() {
      if (!this.body) {
        throw new Error('No body to parse');
      }
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }
  },
  NextResponse: {
    json: (data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    }),
  },
}));

import { NextRequest } from 'next/server';
import { GET as getClusters } from '@/app/api/map/clusters/route';
import { GET as getContractorPreview } from '@/app/api/map/contractors/[id]/preview/route';
import {
  POST as postInteraction,
  GET as getInteractions,
} from '@/app/api/map/interactions/route';

// Mock Supabase client with proper chaining support
const createMockQuery = () => {
  const mockQuery = {
    eq: jest.fn(() => mockQuery),
    not: jest.fn(() => mockQuery),
    or: jest.fn(() => mockQuery),
    single: jest.fn(() =>
      Promise.resolve({ data: mockContractorsData[0], error: null })
    ),
    then: jest.fn(resolve =>
      resolve({ data: mockContractorsData, error: null })
    ),
  };
  return mockQuery;
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(tableName => {
      if (tableName === 'map_interactions') {
        return {
          insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      return {
        select: jest.fn(() => createMockQuery()),
      };
    }),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  })),
}));

// Mock map service
jest.mock('@/lib/maps/map-service', () => ({
  mapService: {
    geocodeAddress: jest.fn(() =>
      Promise.resolve({ lat: -36.8485, lng: 174.7633 })
    ),
  },
}));

// Mock cluster service
jest.mock('@/lib/maps/clustering/cluster-service', () => ({
  clusterService: {
    createClusters: jest.fn(() => [
      {
        id: 'cluster-1',
        center: { lat: -36.8485, lng: 174.7633 },
        contractors: mockContractorsData,
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
    ]),
  },
}));

// Mock contractors data
const mockContractorsData = [
  {
    user_id: 'contractor-1',
    company_name: 'Test Catering',
    business_address: '123 Main St, Auckland',
    is_verified: true,
    subscription_tier: 'premium',
    users: {
      id: 'contractor-1',
      role: 'contractor',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
        profile_photo_url: 'https://example.com/photo.jpg',
      },
    },
    services: [
      {
        service_type: 'catering',
        description: 'Catering services',
        price_range_min: 100,
        price_range_max: 500,
      },
    ],
  },
  {
    user_id: 'contractor-2',
    company_name: 'Test Photography',
    business_address: '456 Queen St, Auckland',
    is_verified: false,
    subscription_tier: 'essential',
    users: {
      id: 'contractor-2',
      role: 'contractor',
      profiles: {
        first_name: 'Jane',
        last_name: 'Smith',
        profile_photo_url: 'https://example.com/photo2.jpg',
      },
    },
    services: [
      {
        service_type: 'photography',
        description: 'Photography services',
        price_range_min: 200,
        price_range_max: 800,
      },
    ],
  },
];

describe('Map Clustering API', () => {
  describe('GET /api/map/clusters', () => {
    it('should return clusters with valid bounds', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=-36.8480&south=-36.8490&east=174.7640&west=174.7630&zoom=10'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('clusters');
      expect(data).toHaveProperty('pins');
      expect(data).toHaveProperty('bounds');
      expect(data).toHaveProperty('zoom');
      expect(data).toHaveProperty('filters');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('clusterCount');
      expect(data.clusters).toHaveLength(1);
      expect(data.pins).toHaveLength(2);
    });

    it('should return 400 for invalid bounds', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=invalid&south=-36.8490&east=174.7640&west=174.7630'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid map bounds provided');
    });

    it('should filter by service type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=-36.8480&south=-36.8490&east=174.7640&west=174.7630&service_type=catering'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.service_type).toBe('catering');
    });

    it('should filter by verification status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=-36.8480&south=-36.8490&east=174.7640&west=174.7630&verified_only=true'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.verified_only).toBe(true);
    });

    it('should filter by subscription tier', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=-36.8480&south=-36.8490&east=174.7640&west=174.7630&subscription_tier=premium'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.subscription_tier).toBe('premium');
    });

    it('should filter by search query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/clusters?north=-36.8480&south=-36.8490&east=174.7640&west=174.7630&search_query=Test'
      );

      const response = await getClusters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.search_query).toBe('Test');
    });
  });

  describe('GET /api/map/contractors/[id]/preview', () => {
    it('should return contractor preview data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors/contractor-1/preview'
      );

      const response = await getContractorPreview(request, {
        params: { id: 'contractor-1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('contractor');
      expect(data.contractor).toHaveProperty('id');
      expect(data.contractor).toHaveProperty('company_name');
      expect(data.contractor).toHaveProperty('business_address');
      expect(data.contractor).toHaveProperty('is_verified');
      expect(data.contractor).toHaveProperty('subscription_tier');
      expect(data.contractor).toHaveProperty('services');
    });

    it('should return 400 for missing contractor ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors//preview'
      );

      const response = await getContractorPreview(request, {
        params: { id: '' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contractor ID is required');
    });

    it('should return 404 for non-existent contractor', async () => {
      // Mock Supabase to return no data
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { message: 'Not found' },
                })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/contractors/non-existent/preview'
      );

      const response = await getContractorPreview(request, {
        params: { id: 'non-existent' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Contractor not found');
    });
  });

  describe('POST /api/map/interactions', () => {
    it('should record interaction successfully', async () => {
      // Mock Supabase for this test
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        auth: {
          getUser: jest.fn(() => ({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })),
        },
      });

      const request = {
        url: 'http://localhost:3000/api/map/interactions',
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: jest.fn().mockResolvedValue({
          interaction_type: 'click',
          contractor_id: 'contractor-1',
          map_bounds: {
            north: -36.848,
            south: -36.849,
            east: 174.764,
            west: 174.763,
          },
          zoom_level: 10,
        }),
      } as any;

      const response = await postInteraction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      // Mock Supabase for this test
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        auth: {
          getUser: jest.fn(() => ({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })),
        },
      });

      const request = {
        url: 'http://localhost:3000/api/map/interactions',
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: jest.fn().mockResolvedValue({
          interaction_type: 'click',
          // Missing contractor_id
        }),
      } as any;

      const response = await postInteraction(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'interaction_type and contractor_id are required'
      );
    });

    it('should handle anonymous interactions', async () => {
      // Mock auth to return no user
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        auth: {
          getUser: jest.fn(() => ({
            data: { user: null },
            error: { message: 'Not authenticated' },
          })),
        },
      });

      const request = {
        url: 'http://localhost:3000/api/map/interactions',
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: jest.fn().mockResolvedValue({
          interaction_type: 'hover',
          contractor_id: 'contractor-1',
        }),
      } as any;

      const response = await postInteraction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/map/interactions/analytics', () => {
    it('should return interaction analytics', async () => {
      // Mock interactions data
      const mockInteractions = [
        {
          interaction_type: 'click',
          contractor_id: 'contractor-1',
          zoom_level: 10,
          created_at: new Date().toISOString(),
          contractors: {
            company_name: 'Test Catering',
            service_type: 'catering',
          },
        },
        {
          interaction_type: 'hover',
          contractor_id: 'contractor-2',
          zoom_level: 12,
          created_at: new Date().toISOString(),
          contractors: {
            company_name: 'Test Photography',
            service_type: 'photography',
          },
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => ({
                  data: mockInteractions,
                  error: null,
                })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/map/interactions/analytics?period=7d'
      );

      const response = await getInteractions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('analytics');
      expect(data.analytics).toHaveProperty('total_interactions');
      expect(data.analytics).toHaveProperty('interaction_types');
      expect(data.analytics).toHaveProperty('popular_contractors');
      expect(data.analytics).toHaveProperty('zoom_levels');
      expect(data.analytics).toHaveProperty('daily_interactions');
      expect(data.analytics.total_interactions).toBe(2);
    });

    it('should handle custom date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/interactions/analytics?date_from=2024-01-01&date_to=2024-01-31'
      );

      const response = await getInteractions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date_range.from).toBe('2024-01-01');
      expect(data.date_range.to).toBe('2024-01-31');
    });

    it('should default to last 7 days when no date range provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/map/interactions/analytics'
      );

      const response = await getInteractions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date_range.from).toBeDefined();
      expect(data.date_range.to).toBeDefined();
    });
  });
});
