import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/email/welcome/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
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
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

jest.mock('@/lib/email/sendgrid-service', () => ({
  SendGridService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(() =>
      Promise.resolve({
        success: true,
        messageId: 'test-message-id',
      })
    ),
  })),
}));

jest.mock('@/lib/email/email-template-manager', () => ({
  EmailTemplateManager: jest.fn().mockImplementation(() => ({
    getTemplate: jest.fn(() =>
      Promise.resolve({
        id: 'welcome-template',
        name: 'Welcome Email Template',
        subject: 'Welcome to EventProsNZ!',
        html_content: '<h1>Welcome {{firstName}}!</h1>',
        text_content: 'Welcome {{firstName}}!',
        variables: ['firstName', 'lastName'],
      })
    ),
    renderTemplate: jest.fn(() =>
      Promise.resolve({
        subject: 'Welcome to EventProsNZ!',
        html: '<h1>Welcome John!</h1>',
        text: 'Welcome John!',
      })
    ),
  })),
}));

describe('Welcome Email Series API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/email/welcome', () => {
    it('should send welcome email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
      };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
            userType: 'event_manager',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.messageId).toBe('test-message-id');
    });

    it('should return 401 for unauthorized user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should return 400 for missing user ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('User ID is required');
    });

    it('should return 404 for user not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: new Error('User not found'),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('User not found');
    });
  });

  describe('GET /api/email/welcome', () => {
    it('should fetch welcome emails successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockWelcomeEmails = [
        {
          id: 'email-1',
          user_id: 'user-123',
          email_type: 'welcome_series',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().eq().order.mockResolvedValue({
        data: mockWelcomeEmails,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome?userId=user-123'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.welcomeEmails).toHaveLength(1);
    });

    it('should return 400 for missing user ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/welcome'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('User ID is required');
    });
  });
});
