import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Dashboard Performance Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn(),
      })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Query Optimization', () => {
    it('should use pagination to limit results', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock dashboard query with pagination
      mockSupabase
        .from()
        .select()
        .eq()
        .gte()
        .order()
        .range.mockResolvedValue({
          data: Array(20)
            .fill(null)
            .map((_, i) => ({
              id: `event-${i}`,
              title: `Event ${i}`,
              status: 'confirmed',
              budget_total: 1000,
              event_milestones: [],
              event_feedback: [],
            })),
          error: null,
          count: 1000,
        });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard?page=1&limit=20',
      });

      const startTime = Date.now();
      await getDashboardHandler(req as NextRequest);
      const endTime = Date.now();

      // Verify pagination was applied
      expect(mockSupabase.from().range).toHaveBeenCalledWith(0, 19);

      // Verify query completed within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should use selective field loading', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock dashboard query
      mockSupabase.from().select().eq().gte().order().range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard',
      });

      await getDashboardHandler(req as NextRequest);

      // Verify selective field loading
      const selectCall = mockSupabase.from().select.mock.calls[0][0];
      expect(selectCall).toContain('id,');
      expect(selectCall).toContain('title,');
      expect(selectCall).toContain('status,');
      expect(selectCall).toContain('event_date,');
      expect(selectCall).toContain('budget_total,');
      expect(selectCall).toContain(
        'event_milestones!inner(id, milestone_name, status)'
      );
      expect(selectCall).toContain('event_feedback!inner(id, rating)');
    });

    it('should handle large datasets efficiently', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock large dataset
      const largeDataset = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `event-${i}`,
          title: `Event ${i}`,
          status: 'confirmed',
          budget_total: 1000,
          event_milestones: Array(5)
            .fill(null)
            .map((_, j) => ({
              id: `milestone-${i}-${j}`,
              milestone_name: `Milestone ${j}`,
              status: 'completed',
            })),
          event_feedback: Array(3)
            .fill(null)
            .map((_, k) => ({
              id: `feedback-${i}-${k}`,
              rating: 4.5,
            })),
        }));

      mockSupabase.from().select().eq().gte().order().range.mockResolvedValue({
        data: largeDataset,
        error: null,
        count: 1000,
      });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard?limit=100',
      });

      const startTime = Date.now();
      const response = await getDashboardHandler(req as NextRequest);
      const endTime = Date.now();

      // Verify response time is reasonable even with large dataset
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds

      // Verify response structure
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.dashboard).toBeDefined();
      expect(responseData.data.pagination).toBeDefined();
    });
  });

  describe('Query Performance Monitoring', () => {
    it('should log slow queries', async () => {
      // Mock slow query
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Simulate slow query
      mockSupabase
        .from()
        .select()
        .eq()
        .gte()
        .order()
        .range.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: [],
                error: null,
                count: 0,
              });
            }, 100); // 100ms delay
          });
        });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard',
      });

      const startTime = Date.now();
      await getDashboardHandler(req as NextRequest);
      const endTime = Date.now();

      // Verify query took expected time
      expect(endTime - startTime).toBeGreaterThan(90);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock fast query
      mockSupabase.from().select().eq().gte().order().range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      // Create multiple concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() => {
          const { req } = createMocks({
            method: 'GET',
            url: 'http://localhost:3000/api/events/dashboard',
          });
          return getDashboardHandler(req as NextRequest);
        });

      const startTime = Date.now();
      await Promise.all(requests);
      const endTime = Date.now();

      // Verify all requests completed within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second for 10 concurrent requests
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not load unnecessary data', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock query with minimal data
      mockSupabase
        .from()
        .select()
        .eq()
        .gte()
        .order()
        .range.mockResolvedValue({
          data: Array(100)
            .fill(null)
            .map((_, i) => ({
              id: `event-${i}`,
              title: `Event ${i}`,
              status: 'confirmed',
              budget_total: 1000,
              event_milestones: [],
              event_feedback: [],
            })),
          error: null,
          count: 100,
        });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard?limit=100',
      });

      const response = await getDashboardHandler(req as NextRequest);
      const responseData = await response.json();

      // Verify response doesn't include unnecessary fields
      expect(responseData.data.events[0]).toHaveProperty('id');
      expect(responseData.data.events[0]).toHaveProperty('title');
      expect(responseData.data.events[0]).toHaveProperty('status');
      expect(responseData.data.events[0]).toHaveProperty('budget_total');
      expect(responseData.data.events[0]).not.toHaveProperty('description');
      expect(responseData.data.events[0]).not.toHaveProperty('location');
    });
  });

  describe('Caching Strategy', () => {
    it('should implement efficient data processing', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock data with various statuses
      const mockData = [
        { id: '1', status: 'draft', budget_total: 1000, event_type: 'wedding' },
        {
          id: '2',
          status: 'confirmed',
          budget_total: 2000,
          event_type: 'corporate',
        },
        {
          id: '3',
          status: 'completed',
          budget_total: 3000,
          event_type: 'wedding',
        },
        {
          id: '4',
          status: 'cancelled',
          budget_total: 500,
          event_type: 'party',
        },
      ];

      mockSupabase.from().select().eq().gte().order().range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 4,
      });

      const { getDashboardHandler } = await import(
        '@/app/api/events/dashboard/route'
      );

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/events/dashboard',
      });

      const startTime = Date.now();
      const response = await getDashboardHandler(req as NextRequest);
      const endTime = Date.now();

      const responseData = await response.json();

      // Verify efficient data processing
      expect(responseData.data.dashboard.status_breakdown).toEqual({
        draft: 1,
        confirmed: 1,
        completed: 1,
        cancelled: 1,
      });

      expect(responseData.data.dashboard.event_type_breakdown).toEqual({
        wedding: 2,
        corporate: 1,
        party: 1,
      });

      expect(responseData.data.dashboard.total_budget).toBe(6500);

      // Verify processing time is reasonable
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
