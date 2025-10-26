import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/access/permissions/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock AccessControlService
jest.mock('@/lib/security/access-control-service', () => ({
  AccessControlService: jest.fn().mockImplementation(() => ({
    getPermissions: jest.fn(),
    checkPermission: jest.fn(),
  })),
}));

describe('/api/access/permissions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return permissions for authenticated user', async () => {
      const mockUser = { id: 'user1' };
      const mockPermissions = [
        { id: '1', name: 'users:read', resource: 'users', action: 'read' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.getPermissions.mockResolvedValue(mockPermissions);

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.permissions).toEqual(mockPermissions);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('should create permission for admin user', async () => {
      const mockUser = { id: 'admin1' };
      const mockPermission = {
        id: '1',
        name: 'test:permission',
        resource: 'test',
        action: 'permission',
        description: 'Test permission',
      };
      const permissionData = {
        name: 'test:permission',
        resource: 'test',
        action: 'permission',
        description: 'Test permission',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.checkPermission.mockResolvedValue({ hasAccess: true });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockPermission, error: null })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions',
        {
          method: 'POST',
          body: JSON.stringify(permissionData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.permission).toEqual(mockPermission);
    });

    it('should return 403 for insufficient permissions', async () => {
      const mockUser = { id: 'user1' };
      const permissionData = {
        name: 'test:permission',
        resource: 'test',
        action: 'permission',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.checkPermission.mockResolvedValue({ hasAccess: false });

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions',
        {
          method: 'POST',
          body: JSON.stringify(permissionData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should return 400 for missing required fields', async () => {
      const mockUser = { id: 'admin1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.checkPermission.mockResolvedValue({ hasAccess: true });

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'test:permission' }), // Missing resource and action
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, resource, and action are required');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'admin1' };
      const permissionData = {
        name: 'test:permission',
        resource: 'test',
        action: 'permission',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.checkPermission.mockResolvedValue({ hasAccess: true });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/permissions',
        {
          method: 'POST',
          body: JSON.stringify(permissionData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create permission');
    });
  });
});
