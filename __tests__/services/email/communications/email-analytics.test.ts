import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/email/analytics/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

jest.mock('@/lib/email/sendgrid-service', () => ({
  SendGridService: jest.fn().mockImplementation(() => ({
    getEmailAnalytics: jest.fn(() =>
      Promise.resolve({
        total: 1000,
        sent: 950,
        delivered: 900,
        bounced: 50,
        complained: 10,
        failed: 40,
        deliveryRate: 94.7,
        bounceRate: 5.0,
        complaintRate: 1.0,
      })
    ),
  })),
}));

describe('Email Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/email/analytics', () => {
    it('should fetch email analytics successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockCommunications = [
        {
          id: 'comm-1',
          user_id: 'user-123',
          email_type: 'welcome_series',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 'comm-2',
          user_id: 'user-123',
          email_type: 'job_application_confirmation',
          status: 'sent',
          sent_at: '2024-01-20T11:00:00Z',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockCommunications,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.analytics).toBeDefined();
      expect(responseData.analytics.totalCommunications).toBe(2);
    });

    it('should filter analytics by date range', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics?startDate=2024-01-01&endDate=2024-01-31'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should filter analytics by email type', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics?emailType=welcome_series'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should return 401 for unauthorized user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/email/analytics', () => {
    it('should get detailed analytics for specific email type', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockCommunications = [
        {
          id: 'comm-1',
          user_id: 'user-123',
          email_type: 'welcome_series',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
          template_id: 'template-1',
        },
        {
          id: 'comm-2',
          user_id: 'user-123',
          email_type: 'welcome_series',
          status: 'sent',
          sent_at: '2024-01-21T10:00:00Z',
          template_id: 'template-1',
        },
      ];

      const mockEmailLogs = [
        {
          id: 'log-1',
          template_id: 'template-1',
          status: 'delivered',
          opened_at: '2024-01-20T14:00:00Z',
          clicked_at: '2024-01-20T14:05:00Z',
        },
        {
          id: 'log-2',
          template_id: 'template-1',
          status: 'delivered',
          opened_at: '2024-01-21T15:00:00Z',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock communications query
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockCommunications,
        error: null,
      });

      // Mock email logs query
      mockSupabase.from().select().in.mockResolvedValueOnce({
        data: mockEmailLogs,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics',
        {
          method: 'POST',
          body: JSON.stringify({
            emailType: 'welcome_series',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            metrics: ['delivery_rate', 'open_rate', 'click_rate'],
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.analytics.emailType).toBe('welcome_series');
      expect(responseData.analytics.totalSent).toBe(2);
      expect(responseData.analytics.deliveryRate).toBeDefined();
      expect(responseData.analytics.openRate).toBeDefined();
      expect(responseData.analytics.clickRate).toBeDefined();
    });

    it('should return 400 for missing email type', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics',
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing emailType
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Email type is required');
    });

    it('should handle email logs fetch error gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockCommunications = [
        {
          id: 'comm-1',
          user_id: 'user-123',
          email_type: 'welcome_series',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
          template_id: 'template-1',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock communications query
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockCommunications,
        error: null,
      });

      // Mock email logs query with error
      mockSupabase
        .from()
        .select()
        .in.mockResolvedValueOnce({
          data: null,
          error: new Error('Failed to fetch email logs'),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/email/analytics',
        {
          method: 'POST',
          body: JSON.stringify({
            emailType: 'welcome_series',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      // Should still work even if email logs fail
      expect(responseData.analytics.totalSent).toBe(1);
    });
  });
});
