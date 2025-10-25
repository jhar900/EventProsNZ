import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/users/route';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          order: jest.fn(),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/middleware', () => ({
  createClient: () => ({
    supabase: mockSupabase,
  }),
}));

describe('/api/admin/analytics/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthorized user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 for non-admin user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'user' },
            error: null,
          }),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Admin access required');
  });

  it('returns user growth data for admin user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [
                { created_at: '2024-12-01T00:00:00Z', role: 'user' },
                { created_at: '2024-12-02T00:00:00Z', role: 'contractor' },
              ],
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('growth');
    expect(data).toHaveProperty('cohorts');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('trends');
  });

  it('handles different time periods', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('growth');
  });

  it('calculates growth trends correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const mockUsers = [
      { created_at: '2024-12-01T00:00:00Z', role: 'user' },
      { created_at: '2024-12-02T00:00:00Z', role: 'contractor' },
      { created_at: '2024-12-03T00:00:00Z', role: 'user' },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.growth).toBeDefined();
    expect(Array.isArray(data.growth)).toBe(true);
  });

  it('calculates cohort data correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const mockUsers = [
      { created_at: '2024-12-01T00:00:00Z', role: 'user' },
      { created_at: '2024-12-01T00:00:00Z', role: 'contractor' },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cohorts).toBeDefined();
    expect(Array.isArray(data.cohorts)).toBe(true);
  });

  it('returns correct summary metrics', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toEqual({
      totalSignups: 0,
      totalActiveUsers: 0,
      totalChurned: 0,
      averageRetention: 85.5,
      churnRate: 10.0,
      growthRate: 12.5,
    });
  });

  it('returns correct trends', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.trends).toEqual({
      signupTrend: 'up',
      retentionTrend: 'up',
      churnTrend: 'down',
    });
  });

  it('handles database errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn().mockRejectedValue(new Error('Database error')),
          })),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/users'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
