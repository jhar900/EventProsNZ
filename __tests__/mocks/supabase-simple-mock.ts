/**
 * Simple Supabase Mock - Working Method Chaining Implementation
 *
 * This mock correctly handles Supabase method chaining by using mockReturnThis()
 * to ensure that each method call returns the same query object, allowing proper chaining.
 */

export const createSimpleSupabaseMock = () => {
  // Create a simple query object that returns itself for chaining
  const createQueryObject = (table: string) => {
    const query = {
      // Query methods
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),

      // Filter methods
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
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),

      // Ordering methods
      order: jest.fn().mockReturnThis(),

      // Limit/offset methods
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),

      // Execution methods that return promises
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id', table },
        error: null,
      }),

      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'test-id', table },
        error: null,
      }),

      then: jest.fn().mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({
          data: [{ id: 'test-id', table }],
          error: null,
        }).then(onFulfilled, onRejected);
      }),

      // Additional execution methods
      execute: jest.fn().mockResolvedValue({
        data: [{ id: 'test-id', table }],
        error: null,
      }),

      // Abort signal support
      abortSignal: jest.fn().mockReturnThis(),

      // Explain method
      explain: jest.fn().mockResolvedValue({
        data: { query: 'SELECT * FROM ' + table },
        error: null,
      }),

      // Rollback method
      rollback: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),

      // Commit method
      commit: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),

      // Transaction support
      transaction: jest.fn().mockImplementation(callback => {
        return callback(createQueryObject(table));
      }),

      // Subscription support
      subscribe: jest.fn().mockImplementation(callback => {
        return {
          unsubscribe: jest.fn(),
        };
      }),

      // Real-time support
      on: jest.fn().mockImplementation((event, callback) => {
        return {
          unsubscribe: jest.fn(),
        };
      }),

      // Channel support
      channel: jest.fn().mockImplementation(name => {
        return {
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        };
      }),
    };

    return query;
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      return createQueryObject(table);
    }),

    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockImplementation(callback => {
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },

    rpc: jest.fn().mockImplementation((functionName: string, params = {}) => {
      // Mock RPC functions
      if (functionName === 'get_trial_conversion_metrics') {
        return Promise.resolve({
          data: {
            total_trials: 100,
            converted_trials: 30,
            expired_trials: 20,
            conversion_rate: 0.3,
            avg_trial_duration: '14 days',
            revenue: 5000,
            total_conversions: 10,
          },
          error: null,
        });
      }

      if (functionName === 'get_trial_analytics') {
        return Promise.resolve({
          data: {
            total_trials: 100,
            active_trials: 50,
            converted_trials: 30,
            expired_trials: 20,
            conversion_rate: 0.3,
            avg_trial_duration: 14,
            revenue: 5000,
          },
          error: null,
        });
      }

      if (functionName === 'get_trial_insights') {
        return Promise.resolve({
          data: {
            insights: [
              {
                type: 'conversion_trend',
                value: 'increasing',
                confidence: 0.85,
              },
              { type: 'churn_risk', value: 'medium', confidence: 0.7 },
            ],
            recommendations: [
              {
                type: 'email_optimization',
                priority: 'high',
                impact: 'medium',
              },
              { type: 'pricing_strategy', priority: 'medium', impact: 'high' },
            ],
          },
          error: null,
        });
      }

      // Default RPC response
      return Promise.resolve({
        data: { result: 'success' },
        error: null,
      });
    }),

    // Storage support
    storage: {
      from: jest.fn().mockImplementation(bucket => ({
        upload: jest
          .fn()
          .mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: jest
          .fn()
          .mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({ data: { publicUrl: 'test-url' } }),
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'test-signed-url' },
          error: null,
        }),
        createSignedUrls: jest.fn().mockResolvedValue({
          data: [{ signedUrl: 'test-signed-url' }],
          error: null,
        }),
      })),
    },

    // Functions support
    functions: {
      invoke: jest
        .fn()
        .mockResolvedValue({ data: { result: 'success' }, error: null }),
    },

    // Realtime support
    realtime: {
      channel: jest.fn().mockImplementation(name => ({
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    },

    // Additional Supabase client methods
    getUrl: jest.fn().mockReturnValue('https://test.supabase.co'),
    getKey: jest.fn().mockReturnValue('test-key'),
    getHeaders: jest.fn().mockReturnValue({}),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    }),
    getSupabaseUrl: jest.fn().mockReturnValue('https://test.supabase.co'),
    getSupabaseKey: jest.fn().mockReturnValue('test-key'),
    getSupabaseAnonKey: jest.fn().mockReturnValue('test-anon-key'),
    getSupabaseServiceKey: jest.fn().mockReturnValue('test-service-key'),
    getSupabaseJWTSecret: jest.fn().mockReturnValue('test-jwt-secret'),
    getSupabaseDBUrl: jest
      .fn()
      .mockReturnValue('postgresql://test:test@test:5432/test'),
    getSupabaseDBPassword: jest.fn().mockReturnValue('test-password'),
    getSupabaseDBHost: jest.fn().mockReturnValue('test-host'),
    getSupabaseDBPort: jest.fn().mockReturnValue(5432),
    getSupabaseDBName: jest.fn().mockReturnValue('test-db'),
    getSupabaseDBUser: jest.fn().mockReturnValue('test-user'),
    getSupabaseDBSSL: jest.fn().mockReturnValue(true),
    getSupabaseDBPoolSize: jest.fn().mockReturnValue(10),
    getSupabaseDBMaxConnections: jest.fn().mockReturnValue(100),
    getSupabaseDBIdleTimeout: jest.fn().mockReturnValue(30000),
    getSupabaseDBConnectionTimeout: jest.fn().mockReturnValue(10000),
    getSupabaseDBQueryTimeout: jest.fn().mockReturnValue(30000),
    getSupabaseDBStatementTimeout: jest.fn().mockReturnValue(30000),
    getSupabaseDBLockTimeout: jest.fn().mockReturnValue(30000),
    getSupabaseDBIdleInTransactionSessionTimeout: jest
      .fn()
      .mockReturnValue(30000),
    getSupabaseDBTcpKeepalivesIdle: jest.fn().mockReturnValue(600),
    getSupabaseDBTcpKeepalivesInterval: jest.fn().mockReturnValue(30),
    getSupabaseDBTcpKeepalivesCount: jest.fn().mockReturnValue(3),
    getSupabaseDBTcpUserTimeout: jest.fn().mockReturnValue(0),
    getSupabaseDBTcpKeepalives: jest.fn().mockReturnValue(true),
    getSupabaseDBTcpNodelay: jest.fn().mockReturnValue(true),
    getSupabaseDBTcpKeepalivesIdle: jest.fn().mockReturnValue(600),
    getSupabaseDBTcpKeepalivesInterval: jest.fn().mockReturnValue(30),
    getSupabaseDBTcpKeepalivesCount: jest.fn().mockReturnValue(3),
    getSupabaseDBTcpUserTimeout: jest.fn().mockReturnValue(0),
    getSupabaseDBTcpKeepalives: jest.fn().mockReturnValue(true),
    getSupabaseDBTcpNodelay: jest.fn().mockReturnValue(true),
  };
};
