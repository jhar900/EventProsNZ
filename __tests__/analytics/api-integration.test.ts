import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  withRateLimit: jest.fn(rateLimiter => handler => handler),
  analyticsRateLimit: {
    checkLimit: jest.fn().mockResolvedValue(true),
  },
}));

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'admin-user', email: 'admin@example.com' } },
      error: null,
    }),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({
            data: { role: 'admin' },
            error: null,
          })
        ),
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({
                data: [
                  { query: 'photographer', search_count: 10, unique_users: 5 },
                  { query: 'caterer', search_count: 8, unique_users: 3 },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({
            data: { id: 'test-id' },
            error: null,
          })
        ),
      })),
    })),
  })),
  rpc: jest.fn(() =>
    Promise.resolve({
      data: [
        { filter_type: 'location', usage_count: 5 },
        { filter_type: 'service_type', usage_count: 3 },
      ],
      error: null,
    })
  ),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Supabase authentication
mockSupabaseClient.auth = {
  getUser: jest.fn(() =>
    Promise.resolve({
      data: { user: { id: 'admin-user' } },
      error: null,
    })
  ),
};

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Analytics API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/search/queries', () => {
    it('should return query analytics for admin users', async () => {
      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries?period=week&limit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      if (response.status !== 200) {
        console.log('Error response:', data);
      }

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('queries');
      expect(data.queries).toHaveLength(2);
      expect(data.queries[0]).toHaveProperty('query', 'photographer');
      expect(data.queries[0]).toHaveProperty('search_count', 10);
    });

    it('should handle invalid parameters gracefully', async () => {
      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries?period=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('queries');
    });
  });

  describe('GET /api/analytics/search/filters', () => {
    it('should return filter analytics for admin users', async () => {
      const { GET } = await import('@/app/api/analytics/search/filters/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/filters?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('filters');
      expect(data).toHaveProperty('usage_patterns');
      expect(data.filters).toHaveLength(2);
    });
  });

  describe('GET /api/analytics/search/clickthrough', () => {
    it('should return CTR analytics for admin users', async () => {
      const { GET } = await import(
        '@/app/api/analytics/search/clickthrough/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/clickthrough?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('ctr_metrics');
      expect(data).toHaveProperty('click_analytics');
    });
  });

  describe('GET /api/analytics/search/trending', () => {
    it('should return trending data for admin users', async () => {
      const { GET } = await import('@/app/api/analytics/search/trending/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/trending?period=week&limit=20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('trending_terms');
      expect(data).toHaveProperty('trending_services');
    });
  });

  describe('GET /api/analytics/search/behavior', () => {
    it('should return behavior analytics for admin users', async () => {
      const { GET } = await import('@/app/api/analytics/search/behavior/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/behavior?period=week&user_segment=all'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('behavior_metrics');
      expect(data).toHaveProperty('user_journeys');
    });
  });

  describe('GET /api/analytics/search/engagement', () => {
    it('should return engagement metrics for admin users', async () => {
      const { GET } = await import(
        '@/app/api/analytics/search/engagement/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/engagement?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('engagement_metrics');
      expect(data).toHaveProperty('user_activity');
    });
  });

  describe('GET /api/analytics/performance/search', () => {
    it('should return performance metrics for admin users', async () => {
      const { GET } = await import(
        '@/app/api/analytics/performance/search/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/performance/search?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('performance_metrics');
      expect(data).toHaveProperty('alerts');
    });
  });

  describe('GET /api/analytics/performance/infinite-scroll', () => {
    it('should return infinite scroll metrics for admin users', async () => {
      const { GET } = await import(
        '@/app/api/analytics/performance/infinite-scroll/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/performance/infinite-scroll?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('scroll_metrics');
      expect(data).toHaveProperty('optimization_recommendations');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 403 for non-admin users', async () => {
      // Mock non-admin user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'regular-user' } },
        error: null,
      });

      // Mock user profile with non-admin role
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: { role: 'user' },
          error: null,
        });

      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries'
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated users', async () => {
      // Mock no user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient
        .from()
        .select()
        .gte()
        .lte()
        .order()
        .limit.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        });

      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('should handle invalid date ranges', async () => {
      const { GET } = await import('@/app/api/analytics/search/queries/route');

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/search/queries?date_from=invalid&date_to=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
});
