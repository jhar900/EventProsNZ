// Working Enhanced Supabase mock with proper method chaining support
export const createWorkingEnhancedSupabaseMock = () => {
  const createMockQuery = () => {
    const mockQuery = {
      // Query methods - all return this for chaining
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),

      // Filter methods - all return this for chaining
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      notMatch: jest.fn().mockReturnThis(),
      notLike: jest.fn().mockReturnThis(),
      notIlike: jest.fn().mockReturnThis(),
      similar: jest.fn().mockReturnThis(),
      notSimilar: jest.fn().mockReturnThis(),
      regexp: jest.fn().mockReturnThis(),
      notRegexp: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),

      // Order and limit methods - all return this for chaining
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),

      // Execution methods - these return promises
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      }),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      }),
      csv: jest.fn().mockResolvedValue('csv,data'),
      geojson: jest.fn().mockResolvedValue({}),
      explain: jest.fn().mockResolvedValue({}),
      rollback: jest.fn().mockResolvedValue({}),
      returns: jest.fn().mockReturnThis(),
    };

    return mockQuery;
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      const mockQuery = createMockQuery();

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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'test-user-id' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'conversion-1' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'email-1' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'analytics-1' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'insight-1' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
        mockQuery.insert.mockResolvedValue({
          data: { id: 'subscription-1' },
          error: null,
        });
        mockQuery.update.mockResolvedValue({ error: null });
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
      data: {
        total_conversions: 10,
        conversion_rate: 0.3,
        revenue: 5000,
        totalTrials: 100,
        convertedTrials: 30,
        expiredTrials: 20,
        avgTrialDuration: '14 days',
      },
      error: null,
    }),
  };
};

// Mock for error scenarios
export const createErrorSupabaseMock = () => {
  const createMockQuery = () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      notMatch: jest.fn().mockReturnThis(),
      notLike: jest.fn().mockReturnThis(),
      notIlike: jest.fn().mockReturnThis(),
      similar: jest.fn().mockReturnThis(),
      notSimilar: jest.fn().mockReturnThis(),
      regexp: jest.fn().mockReturnThis(),
      notRegexp: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      csv: jest.fn(),
      geojson: jest.fn(),
      explain: jest.fn(),
      rollback: jest.fn(),
      returns: jest.fn().mockReturnThis(),
    };

    return mockQuery;
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      const mockQuery = createMockQuery();

      // Configure error responses for all tables
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      mockQuery.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      mockQuery.update.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      return mockQuery;
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Auth error' },
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    rpc: jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'RPC function not found' },
    }),
  };
};
