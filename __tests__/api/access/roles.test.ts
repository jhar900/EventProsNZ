import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/access/roles/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock AccessControlService
jest.mock('@/lib/security/access-control-service', () => ({
  AccessControlService: jest.fn().mockImplementation(() => ({
    getRoles: jest.fn(),
    createRole: jest.fn(),
    checkPermission: jest.fn(),
  })),
}));

describe('/api/access/roles', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return roles for authenticated user', async () => {
      const mockUser = { id: 'user1' };
      const mockRoles = [
        { id: '1', name: 'admin', description: 'Administrator' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.getRoles.mockResolvedValue(mockRoles);

      const request = new NextRequest('http://localhost:3000/api/access/roles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roles).toEqual(mockRoles);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/access/roles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      const mockUser = { id: 'user1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        AccessControlService,
      } = require('@/lib/security/access-control-service');
      const mockService = new AccessControlService();
      mockService.getRoles.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/access/roles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch roles');
    });
  });

  describe('POST', () => {
    it('should create role for admin user', async () => {
      const mockUser = { id: 'admin1' };
      const mockRole = { id: '1', name: 'test-role', description: 'Test Role' };
      const roleData = {
        name: 'test-role',
        description: 'Test Role',
        permissions: ['read'],
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
      mockService.createRole.mockResolvedValue(mockRole);

      const request = new NextRequest(
        'http://localhost:3000/api/access/roles',
        {
          method: 'POST',
          body: JSON.stringify(roleData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.role).toEqual(mockRole);
    });

    it('should return 403 for insufficient permissions', async () => {
      const mockUser = { id: 'user1' };
      const roleData = {
        name: 'test-role',
        description: 'Test Role',
        permissions: ['read'],
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
        'http://localhost:3000/api/access/roles',
        {
          method: 'POST',
          body: JSON.stringify(roleData),
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
        'http://localhost:3000/api/access/roles',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'test-role' }), // Missing description
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and description are required');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/roles',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'test-role', description: 'Test Role' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
