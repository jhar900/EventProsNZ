import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/route';

// Mock Supabase
jest.mock('@/lib/supabase/middleware', () => ({
  createClient: jest.fn(() => ({
    supabase: {
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
    },
  })),
}));

describe('/api/admin/analytics', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
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
              order: jest.fn(() => ({
                range: jest.fn(),
              })),
            })),
          })),
        })),
      })),
    };
  });

  it('should return 401 for unauthorized users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics'
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

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: 'event_manager' },
        error: null,
      });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Admin access required');
  });

  it('should return analytics data for admin users', async () => {
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

    // Mock analytics data
    const mockAnalyticsData = {
      totalUsers: 100,
      newUsers: 10,
      totalContractors: 50,
      verifiedContractors: 40,
      totalEventManagers: 50,
      verificationRate: 80,
    };

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockAnalyticsData,
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics?period=7d'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('trends');
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('dateRange');
  });

  it('should handle different time periods', async () => {
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

    const periods = ['24h', '7d', '30d', '90d'];

    for (const period of periods) {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/analytics?period=${period}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    }
  });

  it('should handle custom date ranges', async () => {
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

    const dateFrom = '2024-01-01';
    const dateTo = '2024-01-31';

    const request = new NextRequest(
      `http://localhost:3000/api/admin/analytics?date_from=${dateFrom}&date_to=${dateTo}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dateRange.from).toContain('2024-01-01');
    expect(data.dateRange.to).toContain('2024-01-31');
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/analytics'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
