import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';

// Mock Supabase client
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
        range: jest.fn(),
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(),
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
  rpc: jest.fn(),
};

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
    })),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Verification API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/verification/queue', () => {
    it('should return verification queue for admin user', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
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

      // Mock verification queue data
      const mockVerifications = [
        {
          id: 'verification-1',
          user_id: 'user-1',
          status: 'pending',
          priority: 2,
          verification_type: 'contractor',
          submitted_at: '2024-01-01T00:00:00Z',
          users: {
            id: 'user-1',
            email: 'contractor@example.com',
            role: 'contractor',
            created_at: '2024-01-01T00:00:00Z',
          },
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '+64 21 123 4567',
          },
          business_profiles: {
            company_name: 'Doe Events Ltd',
            nzbn: '1234567890123',
          },
        },
      ];

      mockSupabase.from().select().order().order().range.mockResolvedValue({
        data: mockVerifications,
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        count: 1,
        error: null,
      });

      // Import and test the handler
      const { GET } = await import('@/app/api/admin/verification/queue/route');
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/queue'
      );

      const response = await GET(mockRequest);

      expect(response.data.verifications).toEqual(mockVerifications);
      expect(response.data.total).toBe(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const { GET } = await import('@/app/api/admin/verification/queue/route');
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/queue'
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { role: 'contractor' },
          error: null,
        });

      const { GET } = await import('@/app/api/admin/verification/queue/route');
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/queue'
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(403);
      expect(response.data.error).toBe('Forbidden');
    });
  });

  describe('POST /api/admin/verification/[userId]/approve', () => {
    it('should approve user verification', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
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

      // Mock queue item
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: {
            id: 'queue-item-1',
            user_id: 'user-1',
            status: 'pending',
          },
          error: null,
        });

      // Mock successful updates
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 'log-1',
            user_id: 'user-1',
            action: 'approve',
            status: 'approved',
            reason: 'Approved by admin',
            admin_id: 'admin-user-id',
          },
          error: null,
        });

      mockSupabase.rpc.mockResolvedValue({ error: null });

      const { POST } = await import(
        '@/app/api/admin/verification/[userId]/approve/route'
      );
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/user-1/approve',
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Approved by admin' }),
        }
      );

      const response = await POST(mockRequest, {
        params: { userId: 'user-1' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for user not in verification queue', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
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

      // Mock queue item not found
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

      const { POST } = await import(
        '@/app/api/admin/verification/[userId]/approve/route'
      );
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/user-1/approve',
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Approved by admin' }),
        }
      );

      const response = await POST(mockRequest, {
        params: { userId: 'user-1' },
      });

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('User not found in verification queue');
    });
  });

  describe('POST /api/admin/verification/[userId]/reject', () => {
    it('should reject user verification', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
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

      // Mock queue item
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: {
            id: 'queue-item-1',
            user_id: 'user-1',
            status: 'pending',
          },
          error: null,
        });

      // Mock successful updates
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 'log-1',
            user_id: 'user-1',
            action: 'reject',
            status: 'rejected',
            reason: 'Incomplete profile',
            feedback: 'Please complete all required fields',
            admin_id: 'admin-user-id',
          },
          error: null,
        });

      mockSupabase.rpc.mockResolvedValue({ error: null });

      const { POST } = await import(
        '@/app/api/admin/verification/[userId]/reject/route'
      );
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/user-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Incomplete profile',
            feedback: 'Please complete all required fields',
          }),
        }
      );

      const response = await POST(mockRequest, {
        params: { userId: 'user-1' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('GET /api/admin/verification/analytics', () => {
    it('should return verification analytics', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
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

      // Mock verification log data
      const mockLogData = [
        {
          action: 'approve',
          status: 'approved',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          action: 'reject',
          status: 'rejected',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.from().select().gte().lte.mockResolvedValue({
        data: mockLogData,
        error: null,
      });

      // Mock queue data
      const mockQueueData = [
        {
          status: 'pending',
          verification_type: 'contractor',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from().select().gte().lte.mockResolvedValue({
        data: mockQueueData,
        error: null,
      });

      const { GET } = await import(
        '@/app/api/admin/verification/analytics/route'
      );
      const mockRequest = new NextRequest(
        'http://localhost/api/admin/verification/analytics?period=month'
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.data.metrics).toBeDefined();
      expect(response.data.trends).toBeDefined();
    });
  });
});
