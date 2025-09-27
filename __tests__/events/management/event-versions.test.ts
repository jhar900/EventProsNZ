import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/events/[id]/versions/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Event Versions API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('GET /api/events/[id]/versions', () => {
    it('should return event versions', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = { id: 'event-1', event_manager_id: 'user-1' };
      const mockVersions = [
        {
          id: 'version-1',
          version_number: 1,
          changes: { action: 'created' },
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
          },
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
        data: mockVersions,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/versions'
      );
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.versions).toHaveLength(1);
      expect(data.versions[0].version_number).toBe(1);
    });

    it('should return empty array when no versions exist', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = { id: 'event-1', event_manager_id: 'user-1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/versions'
      );
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.versions).toHaveLength(0);
    });
  });

  describe('POST /api/events/[id]/versions', () => {
    it('should create new version successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockEvent = { id: 'event-1', event_manager_id: 'user-1' };
      const mockVersion = {
        id: 'version-2',
        version_number: 2,
        changes: { action: 'manual_update', changes: 'Updated event details' },
        created_by: 'user-1',
        created_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .single.mockResolvedValue({
          data: { version_number: 1 },
          error: null,
        });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockVersion,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/versions',
        {
          method: 'POST',
          body: JSON.stringify({
            changes: {
              action: 'manual_update',
              changes: 'Updated event details',
            },
            reason: 'Event details updated',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'event-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.version.version_number).toBe(2);
    });

    it('should validate request body', async () => {
      const mockUser = { id: 'user-1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events/event-1/versions',
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing required changes field
            reason: 'Event details updated',
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
});
