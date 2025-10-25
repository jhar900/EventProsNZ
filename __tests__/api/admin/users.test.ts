import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/users/route';
import {
  validateAdminAccess,
  checkRateLimit,
} from '@/lib/middleware/admin-auth';

// Mock the admin auth middleware
jest.mock('@/lib/middleware/admin-auth', () => ({
  validateAdminAccess: jest.fn(),
  logAdminAction: jest.fn(),
  checkRateLimit: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/middleware', () => ({
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
              count: 'exact',
            })),
          })),
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              count: 'exact',
            })),
          })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                count: 'exact',
              })),
            })),
          })),
        })),
        is: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              count: 'exact',
            })),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            count: 'exact',
          })),
        })),
        range: jest.fn(() => ({
          count: 'exact',
        })),
      })),
    })),
  })),
}));

describe('/api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return 401 when user is not authenticated', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: false,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not admin', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: false,
        response: new Response(
          JSON.stringify({ error: 'Forbidden - Admin access required' }),
          { status: 403 }
        ),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - Admin access required');
    });

    it('should return users with basic filtering', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          role: 'contractor',
          is_verified: true,
          status: 'active',
        },
        {
          id: '2',
          email: 'user2@example.com',
          role: 'event_manager',
          is_verified: false,
          status: 'active',
        },
      ];

      // Create a mock query builder that handles chaining
      const createMockQuery = () => {
        const query = {
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 2,
          }),
        };
        return query;
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => createMockQuery()),
        })),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: mockSupabase,
        user: { id: 'admin-1' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users?role=contractor'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should handle search queries', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'john@example.com',
          role: 'contractor',
          is_verified: true,
          status: 'active',
        },
      ];

      // Create a mock query builder that handles chaining
      const createMockQuery = () => {
        const query = {
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 1,
          }),
        };
        return query;
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => createMockQuery()),
        })),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: mockSupabase,
        user: { id: 'admin-1' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users?search=john'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'contractor',
        is_verified: true,
        status: 'active',
      }));

      // Create a mock query builder that handles chaining
      const createMockQuery = () => {
        const query = {
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 50,
          }),
        };
        return query;
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => createMockQuery()),
        })),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: mockSupabase,
        user: { id: 'admin-1' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users?limit=10&offset=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(10);
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Create a mock query builder that handles chaining
      const createMockQuery = () => {
        const query = {
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
            count: null,
          }),
        };
        return query;
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => createMockQuery()),
        })),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: mockSupabase,
        user: { id: 'admin-1' },
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch users');
    });
  });
});
