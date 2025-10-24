import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/feature-requests/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: [],
              error: null,
              count: 0,
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('/api/admin/feature-requests', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests'
    );
  });

  it('returns 401 when user is not authenticated', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
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

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  it('returns feature requests for admin user', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    const mockRequests = [
      {
        id: '1',
        title: 'Test Request',
        status: 'submitted',
        priority: 'high',
        created_at: '2024-01-01T00:00:00Z',
        feature_request_categories: { name: 'UI', color: '#3B82F6' },
        feature_request_tag_assignments: [
          { feature_request_tags: { name: 'frontend' } },
        ],
        profiles: { first_name: 'John', last_name: 'Doe' },
      },
    ];

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: mockRequests,
      error: null,
      count: 1,
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.requests).toHaveLength(1);
    expect(data.requests[0].title).toBe('Test Request');
    expect(data.pagination.total).toBe(1);
  });

  it('handles search parameter', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithSearch = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?search=test'
    );

    const response = await GET(requestWithSearch);

    expect(response.status).toBe(200);
    expect(mockSupabase.from().select().or).toHaveBeenCalledWith(
      'title.ilike.%test%,description.ilike.%test%'
    );
  });

  it('handles status filter', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithStatus = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?status=submitted'
    );

    const response = await GET(requestWithStatus);

    expect(response.status).toBe(200);
  });

  it('handles priority filter', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithPriority = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?priority=high'
    );

    const response = await GET(requestWithPriority);

    expect(response.status).toBe(200);
  });

  it('handles sorting parameters', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithSort = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?sort_by=vote_count&sort_order=desc'
    );

    const response = await GET(requestWithSort);

    expect(response.status).toBe(200);
  });

  it('handles pagination parameters', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithPagination = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?page=2&limit=10'
    );

    const response = await GET(requestWithPagination);

    expect(response.status).toBe(200);
  });

  it('handles database errors gracefully', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase
      .from()
      .select()
      .or()
      .order()
      .range.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
        count: 0,
      });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch feature requests');
  });

  it('transforms data correctly', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    const mockRequests = [
      {
        id: '1',
        title: 'Test Request',
        status: 'submitted',
        priority: 'high',
        created_at: '2024-01-01T00:00:00Z',
        feature_request_categories: { name: 'UI', color: '#3B82F6' },
        feature_request_tag_assignments: [
          { feature_request_tags: { name: 'frontend' } },
        ],
        profiles: { first_name: 'John', last_name: 'Doe' },
        assigned_user: { first_name: 'Jane', last_name: 'Smith' },
      },
    ];

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: mockRequests,
      error: null,
      count: 1,
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.requests[0]).toHaveProperty('tags');
    expect(data.requests[0]).toHaveProperty('author');
    expect(data.requests[0]).toHaveProperty('assigned_to');
    expect(data.requests[0].tags).toEqual([{ name: 'frontend' }]);
    expect(data.requests[0].author).toEqual({
      first_name: 'John',
      last_name: 'Doe',
    });
    expect(data.requests[0].assigned_to).toEqual({
      first_name: 'Jane',
      last_name: 'Smith',
    });
  });

  it('handles validation errors', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = createClient();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

    mockSupabase.from().select().or().order().range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const requestWithInvalidParams = new NextRequest(
      'http://localhost:3000/api/admin/feature-requests?limit=1000&sort_by=invalid'
    );

    const response = await GET(requestWithInvalidParams);

    expect(response.status).toBe(200);
    // Should handle invalid parameters gracefully
  });
});
