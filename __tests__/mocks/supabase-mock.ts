// Mock Supabase client with proper method chaining
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    notMatch: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    notLike: jest.fn().mockReturnThis(),
    notIlike: jest.fn().mockReturnThis(),
    similar: jest.fn().mockReturnThis(),
    notSimilar: jest.fn().mockReturnThis(),
    regexp: jest.fn().mockReturnThis(),
    notRegexp: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      // Configure specific table behaviors
      if (table === 'users') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'contractor',
            profiles: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
          error: null,
        });
      } else if (table === 'trial_conversions') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'conversion-1',
            user_id: 'test-user-id',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            conversion_status: 'active',
            conversion_tier: 'showcase',
            conversion_reason: 'trial_started',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        });
      } else if (table === 'trial_emails') {
        mockQuery.single.mockResolvedValue({
          data: [
            {
              id: 'email-1',
              user_id: 'test-user-id',
              email_type: 'day_2_optimization',
              email_status: 'sent',
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        });
      } else if (table === 'trial_analytics') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'analytics-1',
            user_id: 'test-user-id',
            trial_day: 2,
            feature_usage: {
              profile_completion: 0.8,
              portfolio_uploads: 3,
              search_usage: 5,
            },
            platform_engagement: {
              login_frequency: 0.7,
              feature_usage_score: 0.6,
              session_duration: 1200,
            },
            conversion_likelihood: 0.75,
            created_at: new Date().toISOString(),
          },
          error: null,
        });
      } else if (table === 'trial_insights') {
        mockQuery.single.mockResolvedValue({
          data: [
            {
              id: 'insight-1',
              user_id: 'test-user-id',
              insight_type: 'profile_optimization',
              insight_data: {
                message: 'Complete your profile to increase visibility',
                actions: ['Add profile photo', 'Complete bio section'],
                priority: 'high',
              },
              confidence_score: 0.9,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        });
      } else if (table === 'subscriptions') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'subscription-1',
            user_id: 'test-user-id',
            tier: 'trial',
            status: 'trial',
            billing_cycle: 'monthly',
            price: 0,
            start_date: new Date().toISOString(),
            trial_end_date: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        });
      }

      return mockQuery;
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    rpc: jest.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
  };
};
