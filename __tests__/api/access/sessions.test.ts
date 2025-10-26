import { NextRequest } from 'next/server';
import { GET } from '@/app/api/access/sessions/route';
import { POST } from '@/app/api/access/sessions/invalidate/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock SecureAuthService
jest.mock('@/lib/security/secure-auth-service', () => ({
  SecureAuthService: jest.fn().mockImplementation(() => ({
    getUserSessions: jest.fn(),
    invalidateSession: jest.fn(),
    invalidateAllUserSessions: jest.fn(),
  })),
}));

describe('/api/access/sessions', () => {
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

  describe('GET /api/access/sessions', () => {
    it('should return sessions for authenticated user', async () => {
      const mockUser = { id: 'user1' };
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          token: 'token123',
          expiresAt: new Date('2024-12-31T23:59:59Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
          lastActivity: new Date('2024-01-01T12:00:00Z'),
          isActive: true,
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        SecureAuthService,
      } = require('@/lib/security/secure-auth-service');
      const mockService = new SecureAuthService();
      mockService.getUserSessions.mockResolvedValue(mockSessions);

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual(mockSessions);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions'
      );
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
        SecureAuthService,
      } = require('@/lib/security/secure-auth-service');
      const mockService = new SecureAuthService();
      mockService.getUserSessions.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sessions');
    });
  });

  describe('POST /api/access/sessions/invalidate', () => {
    it('should invalidate specific session', async () => {
      const mockUser = { id: 'user1' };
      const requestData = {
        sessionId: 'session1',
        invalidateAll: false,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        SecureAuthService,
      } = require('@/lib/security/secure-auth-service');
      const mockService = new SecureAuthService();
      mockService.invalidateSession.mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions/invalidate',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockService.invalidateSession).toHaveBeenCalledWith('session1');
    });

    it('should invalidate all sessions', async () => {
      const mockUser = { id: 'user1' };
      const requestData = {
        invalidateAll: true,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        SecureAuthService,
      } = require('@/lib/security/secure-auth-service');
      const mockService = new SecureAuthService();
      mockService.invalidateAllUserSessions.mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions/invalidate',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockService.invalidateAllUserSessions).toHaveBeenCalledWith(
        'user1'
      );
    });

    it('should return 400 for missing session data', async () => {
      const mockUser = { id: 'user1' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions/invalidate',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Session ID or invalidateAll flag is required');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions/invalidate',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId: 'session1' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      const mockUser = { id: 'user1' };
      const requestData = {
        sessionId: 'session1',
        invalidateAll: false,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const {
        SecureAuthService,
      } = require('@/lib/security/secure-auth-service');
      const mockService = new SecureAuthService();
      mockService.invalidateSession.mockRejectedValue(
        new Error('Service error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/access/sessions/invalidate',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to invalidate session');
    });
  });
});
