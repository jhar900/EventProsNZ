import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '@/app/api/events/[id]/milestones/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Event Milestones API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
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
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('GET /api/events/[id]/milestones', () => {
    it('should return event milestones', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = { id: 'event-1', event_manager_id: 'user-1' };
      const mockMilestones = [
        {
          id: 'milestone-1',
          milestone_name: 'Venue Booking',
          milestone_date: '2024-01-15T00:00:00Z',
          status: 'completed',
          description: 'Book the main venue',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'milestone-2',
          milestone_name: 'Catering Setup',
          milestone_date: '2024-01-20T00:00:00Z',
          status: 'pending',
          description: 'Arrange catering services',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: mockMilestones,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/milestones'
      );
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.milestones).toHaveLength(2);
      expect(data.milestones[0].milestone_name).toBe('Venue Booking');
    });
  });

  describe('POST /api/events/[id]/milestones', () => {
    it('should create new milestone successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = { id: 'event-1', event_manager_id: 'user-1' };
      const mockMilestone = {
        id: 'milestone-3',
        milestone_name: 'Photography Setup',
        milestone_date: '2024-01-25T00:00:00Z',
        status: 'pending',
        description: 'Arrange photography services',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockMilestone,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/milestones',
        {
          method: 'POST',
          body: JSON.stringify({
            milestone_name: 'Photography Setup',
            milestone_date: '2024-01-25T00:00:00Z',
            description: 'Arrange photography services',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.milestone.milestone_name).toBe('Photography Setup');
    });

    it('should validate milestone data', async () => {
      const mockUser = { id: 'user-1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/milestones',
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing required milestone_name
            milestone_date: '2024-01-25T00:00:00Z',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/events/[id]/milestones/[milestone_id]', () => {
    it('should update milestone successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockMilestone = {
        id: 'milestone-1',
        event_id: 'event-1',
        milestone_name: 'Venue Booking',
        milestone_date: '2024-01-15T00:00:00Z',
        status: 'pending',
        events: { event_manager_id: 'user-1' },
      };
      const mockUpdatedMilestone = {
        ...mockMilestone,
        status: 'completed',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockMilestone,
        error: null,
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedMilestone,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/milestones/milestone-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'completed',
          }),
        }
      );

      const response = await PUT(request, {
        params: { id: 'event-1', milestone_id: 'milestone-1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.milestone.status).toBe('completed');
    });
  });
});
