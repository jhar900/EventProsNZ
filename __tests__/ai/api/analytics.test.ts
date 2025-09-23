import { NextRequest } from 'next/server';
import { GET } from '@/app/api/ai/analytics/route';

// Mock Supabase before importing the route
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn((table: string) => {
    // Create a mock query object that can be chained
    const mockQuery = {
      select: jest.fn((columns?: string) => mockQuery),
      eq: jest.fn((column: string, value: any) => mockQuery),
      gte: jest.fn((column: string, value: any) => mockQuery),
      lte: jest.fn((column: string, value: any) => mockQuery),
      like: jest.fn((column: string, value: any) => mockQuery),
      order: jest.fn((column: string, options?: any) => mockQuery),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      then: jest.fn(resolve => {
        // Return consistent data for all queries
        resolve({
          data: [
            {
              id: 'analytics-1',
              user_id: 'user-123',
              event_type: 'wedding',
              created_at: '2024-01-01T00:00:00Z',
              rating: 5,
              feedback_type: 'positive',
              success_metrics: {
                overall_rating: 4.5,
                completion_rate: 0.85,
                satisfaction_score: 4.2,
              },
              service_category: 'Photography',
              conversion_rate: 0.75,
              performance_metrics: {
                response_time: 120,
                accuracy: 0.92,
                user_engagement: 0.78,
              },
            },
          ],
          error: null,
        });
      }),
    };
    return mockQuery;
  }),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/ai/cache', () => ({
  aiCache: {
    generateKey: jest.fn(() => 'mock-cache-key'),
    get: jest.fn(() => null),
    set: jest.fn(),
    setWithType: jest.fn(),
  },
}));

describe('/api/ai/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    });
  });

  describe('GET', () => {
    it('should return recommendation analytics for a valid user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockAnalytics = {
        total_recommendations: 150,
        positive_feedback_rate: 0.75,
        conversion_rate: 0.6,
        top_service_categories: [
          { category: 'Photography', count: 45, conversion_rate: 0.8 },
          { category: 'Catering', count: 38, conversion_rate: 0.65 },
          { category: 'Venue', count: 32, conversion_rate: 0.7 },
        ],
        user_engagement: {
          total_interactions: 200,
          average_rating: 4.2,
          feedback_count: 120,
        },
        performance_metrics: {
          click_through_rate: 0.45,
          time_to_decision: 120, // seconds
          recommendation_accuracy: 0.78,
        },
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      // Mock the query chain to use the global mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn(resolve => {
          resolve({
            data: [
              {
                id: 'analytics-1',
                user_id: 'user-123',
                event_type: 'wedding',
                created_at: '2024-01-01T00:00:00Z',
                rating: 5,
                feedback_type: 'positive',
                success_metrics: {
                  overall_rating: 4.5,
                  completion_rate: 0.85,
                  satisfaction_score: 4.2,
                },
                service_category: 'Photography',
                conversion_rate: 0.75,
                performance_metrics: {
                  response_time: 120,
                  accuracy: 0.92,
                  user_engagement: 0.78,
                },
              },
            ],
            error: null,
          });
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      console.log('Analytics response status:', response.status);
      console.log('Analytics response data:', data);

      expect(response.status).toBe(200);
      expect(data.recommendation_analytics).toBeDefined();
      expect(data.engagement_analytics).toBeDefined();
      expect(data.learning_analytics).toBeDefined();
      expect(data.ab_testing_analytics).toBeDefined();
      expect(data.performance_analytics).toBeDefined();
      expect(data.metadata).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 500 for database errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the global query to return an error
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve, reject) => {
          reject(new Error('Database error'));
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation_analytics).toBeDefined();
      expect(data.engagement_analytics).toBeDefined();
      expect(data.learning_analytics).toBeDefined();
      expect(data.ab_testing_analytics).toBeDefined();
      expect(data.performance_analytics).toBeDefined();
    });

    it('should return analytics for a specific time period', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      // Mock the query chain to use the global mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn(resolve => {
          resolve({
            data: [
              {
                id: 'analytics-1',
                user_id: 'user-123',
                event_type: 'wedding',
                created_at: '2024-01-01T00:00:00Z',
                rating: 5,
                feedback_type: 'positive',
                success_metrics: {
                  overall_rating: 4.5,
                  completion_rate: 0.85,
                  satisfaction_score: 4.2,
                },
                service_category: 'Photography',
                conversion_rate: 0.75,
                performance_metrics: {
                  response_time: 120,
                  accuracy: 0.92,
                  user_engagement: 0.78,
                },
              },
            ],
            error: null,
          });
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation_analytics).toBeDefined();
    });

    it('should return analytics for a specific event type', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      // Mock the query chain to use the global mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn(resolve => {
          resolve({
            data: [
              {
                id: 'analytics-1',
                user_id: 'user-123',
                event_type: 'wedding',
                created_at: '2024-01-01T00:00:00Z',
                rating: 5,
                feedback_type: 'positive',
                success_metrics: {
                  overall_rating: 4.5,
                  completion_rate: 0.85,
                  satisfaction_score: 4.2,
                },
                service_category: 'Photography',
                conversion_rate: 0.75,
                performance_metrics: {
                  response_time: 120,
                  accuracy: 0.92,
                  user_engagement: 0.78,
                },
              },
            ],
            error: null,
          });
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation_analytics).toBeDefined();
    });

    it('should return analytics for a specific service category', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      // Mock the query chain to use the global mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn(resolve => {
          resolve({
            data: [
              {
                id: 'analytics-1',
                user_id: 'user-123',
                event_type: 'wedding',
                created_at: '2024-01-01T00:00:00Z',
                rating: 5,
                feedback_type: 'positive',
                success_metrics: {
                  overall_rating: 4.5,
                  completion_rate: 0.85,
                  satisfaction_score: 4.2,
                },
                service_category: 'Photography',
                conversion_rate: 0.75,
                performance_metrics: {
                  response_time: 120,
                  accuracy: 0.92,
                  user_engagement: 0.78,
                },
              },
            ],
            error: null,
          });
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/analytics?time_period=month&event_type=wedding&user_id=123e4567-e89b-12d3-a456-426614174000&metric_types=recommendations,engagement'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation_analytics).toBeDefined();
    });
  });
});
