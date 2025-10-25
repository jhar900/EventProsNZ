import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/metrics/route';

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
    })),
  })),
};

jest.mock('@/lib/supabase/middleware', () => ({
  createClient: () => ({
    supabase: mockSupabase,
  }),
}));

describe('/api/admin/analytics/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthorized user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/metrics'
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
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Admin access required');
  });

  it('returns metrics data for admin user', async () => {
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
        count: jest.fn(() => ({
          head: jest.fn().mockResolvedValue({
            data: null,
            count: 1000,
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
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('systemHealth');
    expect(data).toHaveProperty('alerts');
    expect(Array.isArray(data.metrics)).toBe(true);
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
        count: jest.fn(() => ({
          head: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('returns correct metrics structure', async () => {
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
        count: jest.fn(() => ({
          head: jest.fn().mockResolvedValue({
            data: null,
            count: 1000,
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
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          value: expect.any(Number),
          previousValue: expect.any(Number),
          unit: expect.any(String),
          trend: expect.any(String),
          status: expect.any(String),
          lastUpdated: expect.any(String),
        }),
      ])
    );
  });

  it('includes system health data', async () => {
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
        count: jest.fn(() => ({
          head: jest.fn().mockResolvedValue({
            data: null,
            count: 1000,
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
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.systemHealth).toEqual({
      status: 'healthy',
      uptime: 99.9,
      responseTime: 150,
      errorRate: 0.1,
    });
  });

  it('includes alerts data', async () => {
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
        count: jest.fn(() => ({
          head: jest.fn().mockResolvedValue({
            data: null,
            count: 1000,
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
      'http://localhost:3000/api/admin/analytics/metrics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String),
        }),
      ])
    );
  });
});
