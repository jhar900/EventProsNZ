import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/access/file-permissions/route';

// Mock the admin auth middleware
jest.mock('@/lib/middleware/admin-auth', () => ({
  validateAdminAccess: jest.fn().mockResolvedValue({
    success: true,
    userId: 'test-admin-id',
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-permission-id',
              file_id: 'test-file-id',
              user_id: 'test-user-id',
              access_level: 'read',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'test-permission-id',
                file_id: 'test-file-id',
                user_id: 'test-user-id',
                access_level: 'read',
                is_active: true,
                created_at: new Date().toISOString(),
                users: { email: 'test@example.com' },
                files: { name: 'test-file.pdf' },
              },
            ],
            error: null,
          }),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-permission-id',
              file_id: 'test-file-id',
              user_id: 'test-user-id',
              access_level: 'read',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

describe('/api/access/file-permissions', () => {
  describe('GET', () => {
    it('should return file permissions successfully', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/file-permissions',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.permissions).toBeDefined();
      expect(Array.isArray(data.permissions)).toBe(true);
      expect(data.count).toBeDefined();
    });

    it('should filter by file_id when provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/file-permissions?file_id=test-file-id',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.permissions).toBeDefined();
    });

    it('should filter by user_id when provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/file-permissions?user_id=test-user-id',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.permissions).toBeDefined();
    });

    it('should return 401 when admin access is invalid', async () => {
      const { validateAdminAccess } = require('@/lib/middleware/admin-auth');
      validateAdminAccess.mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized',
      });

      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/file-permissions',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('should create file permission successfully', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/file-permissions',
        body: {
          file_id: 'test-file-id',
          user_id: 'test-user-id',
          access_level: 'read',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.permission).toBeDefined();
      expect(data.message).toBe('File access permission created successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/file-permissions',
        body: {
          file_id: 'test-file-id',
          // Missing user_id and access_level
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when access level is invalid', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/file-permissions',
        body: {
          file_id: 'test-file-id',
          user_id: 'test-user-id',
          access_level: 'invalid-level',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid access level');
    });

    it('should return 401 when admin access is invalid', async () => {
      const { validateAdminAccess } = require('@/lib/middleware/admin-auth');
      validateAdminAccess.mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized',
      });

      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/file-permissions',
        body: {
          file_id: 'test-file-id',
          user_id: 'test-user-id',
          access_level: 'read',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
