import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/admin/users/bulk/route';
import {
  validateAdminAccess,
  checkRateLimit,
  logAdminAction,
} from '@/lib/middleware/admin-auth';

// Mock the admin auth middleware
jest.mock('@/lib/middleware/admin-auth', () => ({
  validateAdminAccess: jest.fn(),
  checkRateLimit: jest.fn(),
  logAdminAction: jest.fn(),
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
  })),
}));

describe('/api/admin/users/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/admin/users/bulk', () => {
    it('should return 401 when user is not authenticated', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: false,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            user_ids: ['1', '2'],
          }),
        }
      );
      const response = await PUT(request);
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

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            user_ids: ['1', '2'],
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - Admin access required');
    });

    it('should return 429 when rate limit is exceeded', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            user_ids: ['1', '2'],
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded for bulk operations');
    });

    it('should return 400 for invalid request data', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            // Missing user_ids
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid request: action and user_ids are required'
      );
    });

    it('should successfully verify users', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'user1@example.com',
        is_verified: true,
        updated_at: new Date().toISOString(),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: mockUpdatedUser,
                    error: null,
                  })),
                })),
              })),
            })),
            insert: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);
      (logAdminAction as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            user_ids: ['1'],
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].success).toBe(true);
      expect(data.summary.successful).toBe(1);
    });

    it('should successfully suspend users', async () => {
      const mockSuspendedUser = {
        id: '1',
        email: 'user1@example.com',
        status: 'suspended',
        suspension_reason: 'Account suspended by admin',
        suspended_at: new Date().toISOString(),
        suspended_by: 'admin-1',
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: mockSuspendedUser,
                    error: null,
                  })),
                })),
              })),
            })),
            insert: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);
      (logAdminAction as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'suspend',
            user_ids: ['1'],
            data: { message: 'Violation of terms of service' },
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].success).toBe(true);
    });

    it('should handle role changes', async () => {
      const mockRoleChangedUser = {
        id: '1',
        email: 'user1@example.com',
        role: 'event_manager',
        updated_at: new Date().toISOString(),
      };

      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: mockRoleChangedUser,
                    error: null,
                  })),
                })),
              })),
            })),
            insert: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);
      (logAdminAction as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'change_role',
            user_ids: ['1'],
            data: { value: 'event_manager' },
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].success).toBe(true);
    });

    it('should return error for invalid role', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'change_role',
            user_ids: ['1'],
            data: { value: 'invalid_role' },
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].error).toBe('Invalid role');
      expect(data.summary.failed).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      (validateAdminAccess as jest.Mock).mockResolvedValue({
        success: true,
        supabase: {
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { role: 'admin' },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { message: 'Database connection failed' },
                  })),
                })),
              })),
            })),
          })),
        },
        user: { id: 'admin-1' },
      });
      (checkRateLimit as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/bulk',
        {
          method: 'PUT',
          body: JSON.stringify({
            action: 'verify',
            user_ids: ['1'],
          }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].error).toBe('Database connection failed');
    });
  });
});
