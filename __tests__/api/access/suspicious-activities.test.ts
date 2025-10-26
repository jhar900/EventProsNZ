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
import { GET, POST } from '@/app/api/access/suspicious-activities/route';

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
              id: 'test-activity-id',
              user_id: 'test-user-id',
              activity_type: 'rapid_logins',
              severity: 'high',
              details: { count: 15, ip_address: '192.168.1.1' },
              status: 'open',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'test-activity-id',
                user_id: 'test-user-id',
                activity_type: 'rapid_logins',
                severity: 'high',
                details: { count: 15, ip_address: '192.168.1.1' },
                status: 'open',
                created_at: new Date().toISOString(),
                users: { email: 'test@example.com' },
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
              id: 'test-activity-id',
              user_id: 'test-user-id',
              activity_type: 'rapid_logins',
              severity: 'high',
              details: { count: 15, ip_address: '192.168.1.1' },
              status: 'open',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

describe('/api/access/suspicious-activities', () => {
  describe('GET', () => {
    it('should return suspicious activities successfully', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/suspicious-activities',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toBeDefined();
      expect(Array.isArray(data.activities)).toBe(true);
      expect(data.count).toBeDefined();
    });

    it('should filter by user_id when provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/suspicious-activities?user_id=test-user-id',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toBeDefined();
    });

    it('should filter by status when provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/suspicious-activities?status=open',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toBeDefined();
    });

    it('should filter by severity when provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/suspicious-activities?severity=high',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toBeDefined();
    });

    it('should return 401 when admin access is invalid', async () => {
      const { validateAdminAccess } = require('@/lib/middleware/admin-auth');
      validateAdminAccess.mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized',
      });

      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: 'http://localhost:3000/api/access/suspicious-activities',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('should create suspicious activity successfully', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/suspicious-activities',
        body: {
          user_id: 'test-user-id',
          activity_type: 'rapid_logins',
          severity: 'high',
          details: { count: 15, ip_address: '192.168.1.1' },
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activity).toBeDefined();
      expect(data.message).toBe('Suspicious activity created successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/suspicious-activities',
        body: {
          user_id: 'test-user-id',
          // Missing activity_type and severity
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when severity is invalid', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/suspicious-activities',
        body: {
          user_id: 'test-user-id',
          activity_type: 'rapid_logins',
          severity: 'invalid-severity',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid severity');
    });

    it('should return 401 when admin access is invalid', async () => {
      const { validateAdminAccess } = require('@/lib/middleware/admin-auth');
      validateAdminAccess.mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized',
      });

      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: 'http://localhost:3000/api/access/suspicious-activities',
        body: {
          user_id: 'test-user-id',
          activity_type: 'rapid_logins',
          severity: 'high',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
