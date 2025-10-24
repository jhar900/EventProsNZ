import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/feature-requests/route';
import {
  GET as GETById,
  PUT,
  DELETE,
} from '@/app/api/feature-requests/[id]/route';
import {
  POST as VotePost,
  GET as VoteGet,
} from '@/app/api/feature-requests/[id]/vote/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          })),
        })),
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
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

describe('/api/feature-requests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/feature-requests', () => {
    it('returns feature requests with pagination', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFeatureRequests = [
        {
          id: '1',
          title: 'Test Request',
          description: 'Test Description',
          status: 'submitted',
          vote_count: 5,
          view_count: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: true,
          is_featured: false,
        },
      ];

      mockSupabase.from().select().eq().or().order().range.mockResolvedValue({
        data: mockFeatureRequests,
        error: null,
        count: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.featureRequests).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it('returns 401 for unauthorized users', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/feature-requests', () => {
    it('creates a new feature request', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFeatureRequest = {
        id: '1',
        title: 'Test Request',
        description: 'Test Description',
        user_id: mockUser.id,
        status: 'submitted',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockFeatureRequest,
        error: null,
      });

      mockSupabase.from().upsert.mockResolvedValue({
        data: [{ id: 'tag-1', name: 'test' }],
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const requestBody = {
        title: 'Test Request',
        description:
          'This is a detailed description of the feature request that meets the minimum length requirement',
        category_id: 'cat-1',
        priority: 'medium',
        tags: ['test'],
        is_public: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Test Request');
    });

    it('validates required fields', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        title: 'Short',
        description: 'Too short',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
    });
  });
});

describe('/api/feature-requests/[id]', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/feature-requests/[id]', () => {
    it('returns feature request details', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFeatureRequest = {
        id: '1',
        title: 'Test Request',
        description: 'Test Description',
        status: 'submitted',
        is_public: true,
        user_id: mockUser.id,
        view_count: 10,
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockFeatureRequest,
        error: null,
      });

      mockSupabase.from().update().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1'
      );
      const response = await GETById(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Test Request');
    });

    it('returns 404 for non-existent feature request', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/999'
      );
      const response = await GETById(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/feature-requests/[id]', () => {
    it('updates feature request', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_id: mockUser.id, status: 'submitted' },
          error: null,
        });

      mockSupabase
        .from()
        .update()
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { id: '1', title: 'Updated Request' },
          error: null,
        });

      const requestBody = {
        title: 'Updated Request',
        description:
          'Updated description that meets the minimum length requirement',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Request');
    });

    it('returns 403 for non-owner updates', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_id: 'other-user', status: 'submitted' },
          error: null,
        });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { role: 'user' },
          error: null,
        });

      const requestBody = {
        title: 'Updated Request',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: { id: '1' } });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/feature-requests/[id]', () => {
    it('deletes feature request', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_id: mockUser.id },
          error: null,
        });

      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Feature request deleted successfully');
    });
  });
});

describe('/api/feature-requests/[id]/vote', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/feature-requests/[id]/vote', () => {
    it('creates a new vote', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { id: '1', user_id: 'other-user' },
          error: null,
        });

      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const requestBody = {
        vote_type: 'upvote',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1/vote',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await VotePost(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Vote recorded');
    });

    it('prevents voting on own requests', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { id: '1', user_id: mockUser.id },
          error: null,
        });

      const requestBody = {
        vote_type: 'upvote',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1/vote',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await VotePost(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot vote on your own feature request');
    });
  });

  describe('GET /api/feature-requests/[id]/vote', () => {
    it('returns voting data', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockVotes = [
        {
          id: '1',
          vote_type: 'upvote',
          created_at: '2024-01-01T00:00:00Z',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: null,
          },
        },
      ];

      mockSupabase.from().select().eq().order().mockResolvedValue({
        data: mockVotes,
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: { vote_type: 'upvote' },
          error: null,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/feature-requests/1/vote'
      );
      const response = await VoteGet(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.votes).toHaveLength(1);
      expect(data.vote_counts).toBeDefined();
      expect(data.user_vote).toBe('upvote');
    });
  });
});
