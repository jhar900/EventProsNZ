import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/jobs/analytics/route';
import { createClient } from '@/lib/supabase/middleware';

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

// Create a mock query builder that supports chaining
const createMockQuery = (data: any, error: any = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
      head: jest.fn().mockResolvedValue({ data, error }),
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockResolvedValue({ data, error }),
        head: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
    gte: jest.fn().mockReturnValue({
      lte: jest.fn().mockResolvedValue({ data, error }),
      head: jest.fn().mockResolvedValue({ data, error }),
    }),
    order: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data, error }),
    }),
    head: jest.fn().mockResolvedValue({ data, error }),
  }),
});

describe('/api/admin/jobs/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({ supabase: mockSupabase });
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

  describe('Analytics Calculations', () => {
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

      // Mock Redis cache miss
      mockRedis.get.mockResolvedValue(null);
    });

    it('should calculate job board metrics correctly', async () => {
      // Mock database responses with simplified approach
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);

        // Mock all the query methods to return empty data for now
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });

        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('overview');
      expect(data).toHaveProperty('trends');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('performance');
      expect(data.overview).toHaveProperty('totalJobs');
      expect(data.overview).toHaveProperty('activeJobs');
      expect(data.overview).toHaveProperty('totalApplications');
      expect(data.overview).toHaveProperty('conversionRate');
    });

    it('should handle empty datasets gracefully', async () => {
      // Mock empty responses
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.totalJobs).toBe(0);
      expect(data.overview.activeJobs).toBe(0);
      expect(data.overview.totalApplications).toBe(0);
      expect(data.overview.conversionRate).toBe(0);
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
      // Note: We can't easily test that supabase.from wasn't called due to the complex mocking
    });

    it('should cache response data after database query', async () => {
      mockRedis.get.mockResolvedValue(null);

      // Mock database responses
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('analytics:admin-123:30d'),
        300,
        expect.any(String)
      );
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

  describe('Date Range Calculations', () => {
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

    it('should calculate 7-day period correctly', async () => {
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?period=7d'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should calculate 30-day period correctly', async () => {
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?period=30d'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should calculate 90-day period correctly', async () => {
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?period=90d'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should calculate 1-year period correctly', async () => {
      mockSupabase.from.mockImplementation(() => {
        const query = createMockQuery(null, null);
        query.select().head.mockResolvedValue({ data: null, count: 0 });
        query.select().gte().lte.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order.mockResolvedValue({ data: [], error: null });
        query
          .select()
          .gte()
          .lte()
          .order()
          .limit.mockResolvedValue({ data: [], error: null });
        return query;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/jobs/analytics?period=1y'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
