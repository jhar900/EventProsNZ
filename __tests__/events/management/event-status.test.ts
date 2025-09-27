import { NextRequest } from 'next/server';
import { PUT, GET } from '@/app/api/events/[id]/status/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Event Status API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('PUT /api/events/[id]/status', () => {
    it('should update event status successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = {
        id: 'event-1',
        event_manager_id: 'user-1',
        status: 'planning',
      };
      const mockUpdatedEvent = { ...mockEvent, status: 'confirmed' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedEvent,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'confirmed',
            reason: 'All requirements met',
          }),
        }
      );

      const response = await PUT(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event.status).toBe('confirmed');
    });

    it('should reject invalid status transitions', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = {
        id: 'event-1',
        event_manager_id: 'user-1',
        status: 'completed',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'planning',
            reason: 'Invalid transition',
          }),
        }
      );

      const response = await PUT(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain(
        'Cannot transition from completed to planning'
      );
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'confirmed',
          }),
        }
      );

      const response = await PUT(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('GET /api/events/[id]/status', () => {
    it('should return event with status history', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = {
        id: 'event-1',
        event_manager_id: 'user-1',
        status: 'confirmed',
        event_status_history: [
          {
            id: 'history-1',
            previous_status: 'planning',
            new_status: 'confirmed',
            changed_by: 'user-1',
            reason: 'Requirements met',
            created_at: '2024-01-01T00:00:00Z',
            profiles: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        ],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/status'
      );
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event).toBeDefined();
      expect(data.event.event_status_history).toHaveLength(1);
    });
  });
});
