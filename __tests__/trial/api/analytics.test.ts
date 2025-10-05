import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/trial/analytics/route';
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

describe('/api/trial/analytics', () => {
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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (rateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      headers: {},
    });

    mockRequest = new NextRequest('http://localhost:3000/api/trial/analytics');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trial/analytics', () => {
    it('should fetch trial analytics successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockAnalytics = [
        {
          id: 'analytics-1',
          user_id: 'user-1',
          trial_day: 5,
          feature_usage: {
            profile_completion: 0.8,
            portfolio_uploads: 3,
            search_usage: 0.6,
            contact_usage: 0.4,
          },
          platform_engagement: {
            login_frequency: 0.9,
            feature_usage_score: 0.7,
            time_spent: 300,
          },
          conversion_likelihood: 0.75,
        },
      ];
      const mockInsights = [
        {
          id: 'insight-1',
          user_id: 'user-1',
          insight_type: 'profile_optimization',
          insight_data: { message: 'Complete your profile' },
          confidence_score: 0.9,
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockAnalytics,
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockInsights,
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        analytics: mockAnalytics,
        insights: mockInsights,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_analytics');
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_insights');
    });

    it('should fetch trial analytics with date range', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Use the existing mock setup from beforeEach
      const requestWithParams = new NextRequest(
        'http://localhost:3000/api/trial/analytics?date_from=2024-01-01&date_to=2024-01-31'
      );

      const response = await GET(requestWithParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('analytics');
      expect(data).toHaveProperty('insights');
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
      const mockAnalytics = [
        {
          id: 'analytics-1',
          user_id: 'user-1',
          trial_day: 5,
          feature_usage: { profile_completion: 0.8 },
          platform_engagement: { login_frequency: 0.9 },
          conversion_likelihood: 0.75,
        },
      ];
      const mockInsights = [];

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockAnalytics,
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockInsights,
        error: null,
      });

      const requestWithUserId = new NextRequest(
        'http://localhost:3000/api/trial/analytics?user_id=user-1'
      );

      const response = await GET(requestWithUserId);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics).toEqual(mockAnalytics);
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
      expect(data).toEqual({ error: 'Failed to fetch trial analytics' });
    });
  });

  describe('POST /api/trial/analytics', () => {
    it('should track trial analytics successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockAnalytics = {
        id: 'analytics-1',
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: {
          profile_completion: 0.8,
          portfolio_uploads: 3,
          search_usage: 0.6,
          contact_usage: 0.4,
        },
        platform_engagement: {
          login_frequency: 0.9,
          feature_usage_score: 0.7,
          time_spent: 300,
        },
        conversion_likelihood: 0.75,
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAnalytics,
        error: null,
      });

      const requestBody = {
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: {
          profile_completion: 0.8,
          portfolio_uploads: 3,
          search_usage: 0.6,
          contact_usage: 0.4,
        },
        platform_engagement: {
          login_frequency: 0.9,
          feature_usage_score: 0.7,
          time_spent: 300,
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
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
        analytics: mockAnalytics,
        success: true,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_analytics');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: requestBody.feature_usage,
        platform_engagement: requestBody.platform_engagement,
        conversion_likelihood: expect.any(Number),
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
        trial_day: 5,
        // Missing feature_usage and platform_engagement
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
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
        error:
          'user_id, trial_day, feature_usage, and platform_engagement are required',
      });
    });

    it('should handle admin access to track analytics for other user', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com' };
      const mockUserData = { role: 'admin' };
      const mockAnalytics = {
        id: 'analytics-1',
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: { profile_completion: 0.8 },
        platform_engagement: { login_frequency: 0.9 },
        conversion_likelihood: 0.75,
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
        data: mockAnalytics,
        error: null,
      });

      const requestBody = {
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: { profile_completion: 0.8 },
        platform_engagement: { login_frequency: 0.9 },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
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

    it('should handle non-admin access to track analytics for other user', async () => {
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
        trial_day: 5,
        feature_usage: { profile_completion: 0.8 },
        platform_engagement: { login_frequency: 0.9 },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
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
        trial_day: 5,
        feature_usage: { profile_completion: 0.8 },
        platform_engagement: { login_frequency: 0.9 },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to track trial analytics' });
    });

    it('should handle rate limiting', async () => {
      (rateLimit as jest.Mock).mockReturnValueOnce({
        allowed: false,
        message: 'Too many requests',
        headers: { 'Retry-After': '60' },
      });

      const requestBody = {
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: { profile_completion: 0.8 },
        platform_engagement: { login_frequency: 0.9 },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
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

    it('should generate insights when tracking analytics', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockAnalytics = {
        id: 'analytics-1',
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: { profile_completion: 0.5 }, // Low completion
        platform_engagement: { feature_usage_score: 0.3 }, // Low usage
        conversion_likelihood: 0.4,
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock analytics insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAnalytics,
              error: null,
            }),
          }),
        }),
      });

      // Mock insights insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const requestBody = {
        user_id: 'user-1',
        trial_day: 5,
        feature_usage: { profile_completion: 0.5 },
        platform_engagement: { feature_usage_score: 0.3 },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/trial/analytics',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      if (response.status !== 200) {
        console.log('Error response:', data);
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify insights were generated and stored
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_insights');
      // The insights insertion is mocked, so we just verify it was called
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // analytics + insights
    });
  });
});
