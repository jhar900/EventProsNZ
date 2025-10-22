import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/jobs/analytics/route';

// Mock Supabase client
jest.mock('@/lib/supabase/middleware', () => ({
  createClient: jest.fn(),
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
  }));
});

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
};

describe('/api/admin/jobs/analytics - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      require('@/lib/supabase/middleware').createClient as jest.Mock
    ).mockReturnValue({ supabase: mockSupabase });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - Admin access required');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should return 400 for invalid date_from parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?date_from=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date_from parameter');
    });

    it('should return 400 for invalid date_to parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?date_to=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date_to parameter');
    });

    it('should return 400 when start_date is after end_date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?date_from=2024-12-31&date_to=2024-01-01'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('start_date cannot be after end_date');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      mockRedis.get.mockResolvedValue(null);
    });

    it('should handle database connection errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('database connection failed');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection error');
    });

    it('should handle request timeout errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('timeout occurred');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(408);
      expect(data.error).toBe('Request timeout');
    });

    it('should handle invalid URL errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new TypeError('Invalid URL');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('should handle generic errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        overview: { totalJobs: 100, activeJobs: 80 },
        trends: { jobPostings: [] },
        categories: [],
        performance: { topPerformingJobs: [] },
        period: '30d',
        dateRange: {
          from: '2024-11-19T00:00:00.000Z',
          to: '2024-12-19T00:00:00.000Z',
        },
      };

      // Mock Redis to return cached data
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);
    });

    it('should handle Redis cache errors gracefully', async () => {
      // Mock Redis to throw an error
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      // Mock database to return empty data
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
            head: jest.fn().mockResolvedValue({ data: null, count: 0 }),
          }),
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({ data: [], error: null }),
            head: jest.fn().mockResolvedValue({ data: null, count: 0 }),
          }),
        }),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);

      // Should still work even if Redis fails
      expect(response.status).toBe(200);
    });
  });
});
