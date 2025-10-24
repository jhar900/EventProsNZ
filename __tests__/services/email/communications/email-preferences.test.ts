import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, PUT, POST } from '@/app/api/email/preferences/route';

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
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

describe('Email Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/email/preferences', () => {
    it('should fetch email preferences successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockPreferences = [
        {
          id: 'pref-1',
          user_id: 'user-123',
          email_type: 'welcome_series',
          enabled: true,
          frequency: 'immediate',
        },
        {
          id: 'pref-2',
          user_id: 'user-123',
          email_type: 'job_application_confirmation',
          enabled: true,
          frequency: 'immediate',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockPreferences,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences?userId=user-123'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.preferences).toHaveLength(2);
    });

    it('should return 401 for unauthorized user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/email/preferences', () => {
    it('should update email preferences successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockPreferences = [
        {
          email_type: 'welcome_series',
          enabled: true,
          frequency: 'immediate',
        },
        {
          email_type: 'job_application_confirmation',
          enabled: false,
          frequency: 'daily',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().upsert.mockResolvedValue({
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences',
        {
          method: 'PUT',
          body: JSON.stringify({
            userId: 'user-123',
            preferences: mockPreferences,
          }),
        }
      );

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.updatedCount).toBe(2);
    });

    it('should return 400 for invalid preferences structure', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences',
        {
          method: 'PUT',
          body: JSON.stringify({
            userId: 'user-123',
            preferences: [
              {
                // Missing email_type
                enabled: true,
              },
            ],
          }),
        }
      );

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid preference structure');
    });

    it('should return 400 for missing preferences array', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences',
        {
          method: 'PUT',
          body: JSON.stringify({
            userId: 'user-123',
            // Missing preferences array
          }),
        }
      );

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Preferences array is required');
    });
  });

  describe('POST /api/email/preferences', () => {
    it('should update single email preference successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().upsert.mockResolvedValue({
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/preferences',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
            emailType: 'welcome_series',
            enabled: true,
            frequency: 'immediate',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
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
        'http://localhost:3000/api/email/preferences',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
            enabled: true,
            // Missing emailType
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Email type is required');
    });
  });
});
