import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/trial/emails/route';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: jest.fn(),
}));

jest.mock('@/lib/security/csrf-protection', () => ({
  withCSRFProtection: (handler: any) => handler,
}));

describe('/api/trial/emails', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (rateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      headers: {},
    });

    mockRequest = new NextRequest('http://localhost:3000/api/trial/emails');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trial/emails', () => {
    it('should fetch trial emails successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockEmails = [
        {
          id: 'email-1',
          user_id: 'user-1',
          email_type: 'day_2_optimization',
          email_status: 'sent',
          created_at: new Date().toISOString(),
        },
        {
          id: 'email-2',
          user_id: 'user-1',
          email_type: 'day_7_checkin',
          email_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockEmails,
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        emails: mockEmails,
        total: 2,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_emails');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should fetch trial emails with email type filter', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Use the existing mock setup from beforeEach
      const requestWithParams = new NextRequest(
        'http://localhost:3000/api/trial/emails?email_type=day_2_optimization'
      );

      const response = await GET(requestWithParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('emails');
      expect(data).toHaveProperty('total');
    });

    it('should handle unauthorized request', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should handle rate limiting', async () => {
      (rateLimit as jest.Mock).mockReturnValueOnce({
        allowed: false,
        message: 'Too many requests',
        headers: { 'Retry-After': '60' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({ error: 'Too many requests' });
    });

    it('should handle admin access to other user data', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com' };
      const mockUserData = { role: 'admin' };
      const mockEmails = [
        {
          id: 'email-1',
          user_id: 'user-1',
          email_type: 'day_2_optimization',
          email_status: 'sent',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockEmails,
        error: null,
      });

      const requestWithUserId = new NextRequest(
        'http://localhost:3000/api/trial/emails?user_id=user-1'
      );

      const response = await GET(requestWithUserId);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.emails).toEqual(mockEmails);
    });

    it('should handle non-admin access to other user data', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      const mockUserData = { role: 'contractor' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      const requestWithUserId = new NextRequest(
        'http://localhost:3000/api/trial/emails?user_id=user-2'
      );

      const response = await GET(requestWithUserId);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('should handle database error', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch trial emails' });
    });
  });

  describe('POST /api/trial/emails', () => {
    it('should create trial email successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockEmail = {
        id: 'email-1',
        user_id: 'user-1',
        email_type: 'day_2_optimization',
        email_status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockEmail,
        error: null,
      });

      const requestBody = {
        user_id: 'user-1',
        email_type: 'day_2_optimization',
        scheduled_date: new Date().toISOString(),
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        email: mockEmail,
        success: true,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_emails');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        email_type: 'day_2_optimization',
        scheduled_date: expect.any(String),
        email_status: 'pending',
      });
    });

    it('should handle missing required fields', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        user_id: 'user-1',
        // Missing email_type
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'user_id and email_type are required',
      });
    });

    it('should handle admin access to create email for other user', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com' };
      const mockUserData = { role: 'admin' };
      const mockEmail = {
        id: 'email-1',
        user_id: 'user-1',
        email_type: 'day_2_optimization',
        email_status: 'pending',
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockEmail,
        error: null,
      });

      const requestBody = {
        user_id: 'user-1',
        email_type: 'day_2_optimization',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle non-admin access to create email for other user', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      const mockUserData = { role: 'contractor' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      const requestBody = {
        user_id: 'user-2',
        email_type: 'day_2_optimization',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('should handle database error', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const requestBody = {
        user_id: 'user-1',
        email_type: 'day_2_optimization',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create trial email' });
    });

    it('should handle rate limiting', async () => {
      (rateLimit as jest.Mock).mockReturnValueOnce({
        allowed: false,
        message: 'Too many requests',
        headers: { 'Retry-After': '60' },
      });

      const requestBody = {
        user_id: 'user-1',
        email_type: 'day_2_optimization',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/emails',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({ error: 'Too many requests' });
    });
  });
});
