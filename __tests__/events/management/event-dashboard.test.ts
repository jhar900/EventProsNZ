import { NextRequest } from 'next/server';
import { GET } from '@/app/api/events/dashboard/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Event Dashboard API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(),
            })),
          })),
        })),
      })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('GET /api/events/dashboard', () => {
    it('should return dashboard data for default period', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event 1',
          status: 'completed',
          budget_total: 1000,
          event_type: 'wedding',
          event_date: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          event_service_requirements: [],
          event_versions: [],
          event_milestones: [],
          event_feedback: [],
        },
        {
          id: 'event-2',
          title: 'Test Event 2',
          status: 'planning',
          budget_total: 2000,
          event_type: 'corporate',
          event_date: '2024-02-01T00:00:00Z',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          event_service_requirements: [],
          event_versions: [],
          event_milestones: [],
          event_feedback: [],
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().gte().lte().order().mockResolvedValue({
        data: mockEvents,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/dashboard'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dashboard).toBeDefined();
      expect(data.dashboard.total_events).toBe(2);
      expect(data.dashboard.total_budget).toBe(3000);
      expect(data.dashboard.status_breakdown).toHaveProperty('completed', 1);
      expect(data.dashboard.status_breakdown).toHaveProperty('planning', 1);
    });

    it('should return dashboard data for specific period', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event 1',
          status: 'completed',
          budget_total: 1000,
          event_type: 'wedding',
          event_date: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          event_service_requirements: [],
          event_versions: [],
          event_milestones: [],
          event_feedback: [],
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().gte().lte().order().mockResolvedValue({
        data: mockEvents,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/dashboard?period=week'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dashboard.period).toBe('week');
    });

    it('should handle empty events list', async () => {
      const mockUser = { id: 'user-1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().gte().lte().order().mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/dashboard'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dashboard.total_events).toBe(0);
      expect(data.dashboard.total_budget).toBe(0);
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/dashboard'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });
  });
});
