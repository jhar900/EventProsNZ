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
      order: jest.fn((column: string, options?: any) => mockQuery),
      limit: jest.fn((count: number) =>
        Promise.resolve({ data: [], error: null })
      ),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn((data: any) =>
        Promise.resolve({ data: [], error: null })
      ),
      update: jest.fn((data: any) => ({
        eq: jest.fn((column: string, value: any) =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
    };
    return mockQuery;
  }),
};

// Create supabaseMock for test control
const supabaseMock = {
  setAuthUser: (user: any) => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
  },
  setAuthError: (error: Error) => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error,
    });
  },
  setQueryResult: (query: string, result: any) => {
    // This would need to be implemented based on the specific query patterns
    },
  setQueryError: (query: string, error: Error) => {
    // This would need to be implemented based on the specific query patterns
    },
  setInsertResult: (table: string, result: any) => {
    // Mock insert result
    },
  setDatabaseError: (error: Error) => {
    // Set all database operations to fail
    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockQuery = {
        select: jest.fn(() => Promise.resolve({ data: null, error })),
        eq: jest.fn(() => Promise.resolve({ data: null, error })),
        gte: jest.fn(() => Promise.resolve({ data: null, error })),
        order: jest.fn(() => Promise.resolve({ data: null, error })),
        limit: jest.fn(() => Promise.resolve({ data: null, error })),
        single: jest.fn(() => Promise.resolve({ data: null, error })),
        insert: jest.fn(() => Promise.resolve({ data: null, error })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error })),
        })),
      };
      return mockQuery;
    });
  },
  setInsertError: (error: Error) => {
    // Set insert operations to fail
    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockQuery = {
        select: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery),
        gte: jest.fn(() => mockQuery),
        order: jest.fn(() => mockQuery),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              event_type: 'wedding',
              attendee_count: 100,
              budget: 10000,
              user_id: 'user-123',
            },
            error: null,
          })
        ),
        insert: jest.fn(() => Promise.resolve({ data: null, error })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
      return mockQuery;
    });
  },
  reset: () => {
    // Reset to default behavior
    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockQuery = {
        select: jest.fn((columns?: string) => mockQuery),
        eq: jest.fn((column: string, value: any) => mockQuery),
        gte: jest.fn((column: string, value: any) => mockQuery),
        order: jest.fn((column: string, options?: any) => mockQuery),
        limit: jest.fn((count: number) =>
          Promise.resolve({ data: [], error: null })
        ),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        insert: jest.fn((data: any) =>
          Promise.resolve({ data: [], error: null })
        ),
        update: jest.fn((data: any) => ({
          eq: jest.fn((column: string, value: any) =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
      };
      return mockQuery;
    });
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

import { GET, POST } from '@/app/api/ai/learning/route';

// Mock NextRequest
const createMockRequest = (url: string, options: any = {}) => {
  const request = new (require('next/server').NextRequest)(url, options);
  request.json = jest.fn().mockResolvedValue(JSON.parse(options.body || '{}'));
  return request;
};

describe('/api/ai/learning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return learning data for a valid user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockPatterns = [
        {
          id: 'pattern-1',
          event_type: 'wedding',
          service_combination: 'Photography,Catering',
          success_rate: 0.95,
          average_rating: 4.8,
          sample_size: 20,
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockInsights = [
        {
          id: 'insight-1',
          insight_type: 'service_combination',
          title: 'High-performing service combination for wedding',
          description: 'Photography and Catering combination works well',
          data: { services: ['Photography', 'Catering'] },
          confidence: 0.8,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockStats = [
        {
          event_type: 'wedding',
          success_metrics: {
            overall_rating: 4.5,
            budget_variance: 2.1,
            timeline_adherence: 0.95,
          },
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the query chain - the mockQuery will be returned and can be chained
      const mockQuery = mockSupabaseClient.from();
      mockQuery.limit.mockResolvedValue({ data: mockPatterns, error: null });
      mockQuery.single.mockResolvedValue({ data: mockStats, error: null });

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.patterns).toBeDefined();
      expect(data.insights).toBeDefined();
      expect(data.statistics).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      supabaseMock.setAuthError(new Error('Unauthorized'));

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning'
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

      supabaseMock.setAuthUser(mockUser);
      supabaseMock.setDatabaseError(new Error('Database error'));

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    it('should record learning data successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockEvent = {
        event_type: 'wedding',
        attendee_count: 100,
        budget: 20000,
        user_id: 'user-123',
      };

      supabaseMock.setAuthUser(mockUser);
      // Reset to default behavior for successful operations
      supabaseMock.reset();
      // Override the events query to return the mock event
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'events') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({ data: mockEvent, error: null })
                ),
              })),
            })),
          };
        }
        // Default behavior for other tables
        const mockQuery = {
          select: jest.fn((columns?: string) => mockQuery),
          eq: jest.fn((column: string, value: any) => mockQuery),
          gte: jest.fn((column: string, value: any) => mockQuery),
          order: jest.fn((column: string, options?: any) => mockQuery),
          limit: jest.fn((count: number) =>
            Promise.resolve({ data: [], error: null })
          ),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          insert: jest.fn((data: any) =>
            Promise.resolve({ data: [], error: null })
          ),
          update: jest.fn((data: any) => ({
            eq: jest.fn((column: string, value: any) =>
              Promise.resolve({ data: [], error: null })
            ),
          })),
        };
        return mockQuery;
      });

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            services_used: ['Photography', 'Catering'],
            success_metrics: {
              overall_rating: 5,
              budget_variance: 2.5,
              timeline_adherence: 0.95,
              attendee_satisfaction: 4.8,
            },
            feedback: 'Excellent service!',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Learning data recorded successfully');
    });

    it('should return 401 for unauthenticated user', async () => {
      supabaseMock.setAuthError(new Error('Unauthorized'));

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            services_used: ['Photography'],
            success_metrics: {
              overall_rating: 5,
              budget_variance: 0,
              timeline_adherence: 1,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing required fields', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabaseMock.setAuthUser(mockUser);

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            // Missing services_used and success_metrics
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 for invalid rating', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabaseMock.setAuthUser(mockUser);

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            services_used: ['Photography'],
            success_metrics: {
              overall_rating: 10, // Invalid rating (should be 1-5)
              budget_variance: 0,
              timeline_adherence: 1,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockEvent = {
        event_type: 'wedding',
        attendee_count: 100,
        budget: 20000,
        user_id: 'user-123',
      };

      supabaseMock.setAuthUser(mockUser);
      supabaseMock.setInsertError(new Error('Database error'));

      const request = createMockRequest(
        'http://localhost:3000/api/ai/learning',
        {
          method: 'POST',
          body: JSON.stringify({
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            services_used: ['Photography'],
            success_metrics: {
              overall_rating: 5,
              budget_variance: 0,
              timeline_adherence: 1,
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to store learning data');
    });
  });
});
