import { AccessControlService } from '@/lib/security/access-control-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock audit logger
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

describe('AccessControlService', () => {
  let accessControlService: AccessControlService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
          order: jest.fn(() => ({
            limit: jest.fn(),
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
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    accessControlService = new AccessControlService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    it('should return true for wildcard permission', async () => {
      const mockUserRoles = {
        data: [
          {
            id: '1',
            role_id: 'admin',
            is_active: true,
            expires_at: null,
            roles: {
              id: 'admin',
              name: 'admin',
              permissions: ['*'],
            },
          },
        ],
      };

      const mockUserPermissions = {
        data: [],
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockUserRoles),
              })),
            })),
          };
        }
        if (table === 'user_permissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockUserPermissions),
              })),
            })),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await accessControlService.checkPermission(
        'user1',
        'any:permission'
      );

      expect(result.hasAccess).toBe(true);
      expect(result.roles).toContain('admin');
    });

    it('should return false for insufficient permissions', async () => {
      const mockUserRoles = {
        data: [
          {
            id: '1',
            role_id: 'viewer',
            is_active: true,
            expires_at: null,
            roles: {
              id: 'viewer',
              name: 'viewer',
              permissions: ['read'],
            },
          },
        ],
      };

      const mockUserPermissions = {
        data: [],
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockUserRoles),
              })),
            })),
          };
        }
        if (table === 'user_permissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockUserPermissions),
              })),
            })),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await accessControlService.checkPermission(
        'user1',
        'write:permission'
      );

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await accessControlService.checkPermission(
        'user1',
        'any:permission'
      );

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Error checking permissions');
    });
  });

  describe('getRoles', () => {
    it('should fetch and return roles', async () => {
      const mockRoles = {
        data: [
          {
            id: '1',
            name: 'admin',
            description: 'Administrator',
            permissions: ['*'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => mockRoles),
          })),
        })),
      });

      const result = await accessControlService.getRoles();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('admin');
      expect(result[0].permissions).toEqual(['*']);
    });

    it('should handle empty results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({ data: [] })),
          })),
        })),
      });

      const result = await accessControlService.getRoles();

      expect(result).toEqual([]);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = {
        id: '1',
        name: 'test-role',
        description: 'Test Role',
        permissions: ['read'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockRole, error: null })),
          })),
        })),
      });

      const result = await accessControlService.createRole(
        {
          name: 'test-role',
          description: 'Test Role',
          permissions: ['read'],
        },
        'admin-user'
      );

      expect(result.name).toBe('test-role');
      expect(result.permissions).toEqual(['read']);
    });

    it('should handle creation errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Creation failed' },
            })),
          })),
        })),
      });

      await expect(
        accessControlService.createRole(
          {
            name: 'test-role',
            description: 'Test Role',
            permissions: ['read'],
          },
          'admin-user'
        )
      ).rejects.toThrow('Failed to create role: Creation failed');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const mockUserRole = {
        id: '1',
        user_id: 'user1',
        role_id: 'role1',
        assigned_by: 'admin',
        assigned_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockUserRole, error: null })),
          })),
        })),
      });

      const result = await accessControlService.assignRoleToUser(
        'user1',
        'role1',
        'admin'
      );

      expect(result.userId).toBe('user1');
      expect(result.roleId).toBe('role1');
    });
  });

  describe('getAccessControlAnalytics', () => {
    it('should return analytics data', async () => {
      const mockCounts = [{ count: 5 }, { count: 20 }, { count: 100 }];

      const mockRoleDistribution = {
        data: [
          { roles: { name: 'admin' } },
          { roles: { name: 'admin' } },
          { roles: { name: 'user' } },
        ],
      };

      const mockPermissionUsage = {
        data: [
          { permissions: { name: 'read' } },
          { permissions: { name: 'write' } },
        ],
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'roles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({ count: 5 })),
            })),
          };
        }
        if (table === 'permissions') {
          return {
            select: jest.fn(() => ({ count: 20 })),
          };
        }
        if (table === 'user_roles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({ count: 100 })),
              })),
            })),
          };
        }
        if (table === 'user_roles' && mockRoleDistribution) {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockRoleDistribution),
              })),
            })),
          };
        }
        if (table === 'user_permissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => mockPermissionUsage),
              })),
            })),
          };
        }
        return mockSupabase.from(table);
      });

      const result = await accessControlService.getAccessControlAnalytics();

      expect(result.totalRoles).toBe(5);
      expect(result.totalPermissions).toBe(20);
      expect(result.activeUsers).toBe(100);
      expect(result.roleDistribution).toHaveLength(2);
      expect(result.permissionUsage).toHaveLength(2);
    });
  });
});
