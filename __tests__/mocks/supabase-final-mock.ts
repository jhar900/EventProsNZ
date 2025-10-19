/**
 * Final Supabase Mock - Proper Method Chaining Implementation
 *
 * This mock correctly handles Supabase method chaining by creating new query objects
 * for each method call, ensuring that chained methods work properly.
 */

export const createFinalSupabaseMock = () => {
  // Create a new query object for each method call
  const createQueryObject = (table: string) => {
    const queryObject = {
      // Query methods that return new query objects
      select: jest.fn().mockImplementation((columns = '*') => {
        const newQuery = createQueryObject(table);
        newQuery._selectColumns = columns;
        return newQuery;
      }),

      insert: jest.fn().mockImplementation(data => {
        const newQuery = createQueryObject(table);
        newQuery._insertData = data;
        return newQuery;
      }),

      update: jest.fn().mockImplementation(data => {
        const newQuery = createQueryObject(table);
        newQuery._updateData = data;
        return newQuery;
      }),

      delete: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        newQuery._deleteOperation = true;
        return newQuery;
      }),

      // Filter methods that return new query objects
      eq: jest.fn().mockImplementation(function (column, value) {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(this._filters || []),
          { type: 'eq', column, value },
        ];
        // Preserve existing properties
        newQuery._insertData = this._insertData;
        newQuery._updateData = this._updateData;
        newQuery._deleteOperation = this._deleteOperation;
        newQuery._selectColumns = this._selectColumns;
        return newQuery;
      }),

      neq: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'neq', column, value },
        ];
        return newQuery;
      }),

      gt: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'gt', column, value },
        ];
        return newQuery;
      }),

      gte: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'gte', column, value },
        ];
        return newQuery;
      }),

      lt: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'lt', column, value },
        ];
        return newQuery;
      }),

      lte: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'lte', column, value },
        ];
        return newQuery;
      }),

      like: jest.fn().mockImplementation((column, pattern) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'like', column, pattern },
        ];
        return newQuery;
      }),

      ilike: jest.fn().mockImplementation((column, pattern) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'ilike', column, pattern },
        ];
        return newQuery;
      }),

      is: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'is', column, value },
        ];
        return newQuery;
      }),

      in: jest.fn().mockImplementation((column, values) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'in', column, values },
        ];
        return newQuery;
      }),

      contains: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'contains', column, value },
        ];
        return newQuery;
      }),

      containedBy: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'containedBy', column, value },
        ];
        return newQuery;
      }),

      rangeGt: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'rangeGt', column, value },
        ];
        return newQuery;
      }),

      rangeGte: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'rangeGte', column, value },
        ];
        return newQuery;
      }),

      rangeLt: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'rangeLt', column, value },
        ];
        return newQuery;
      }),

      rangeLte: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'rangeLte', column, value },
        ];
        return newQuery;
      }),

      rangeAdjacent: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'rangeAdjacent', column, value },
        ];
        return newQuery;
      }),

      overlaps: jest.fn().mockImplementation((column, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'overlaps', column, value },
        ];
        return newQuery;
      }),

      textSearch: jest.fn().mockImplementation((column, query, options) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'textSearch', column, query, options },
        ];
        return newQuery;
      }),

      match: jest.fn().mockImplementation(query => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'match', query },
        ];
        return newQuery;
      }),

      not: jest.fn().mockImplementation((column, operator, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'not', column, operator, value },
        ];
        return newQuery;
      }),

      or: jest.fn().mockImplementation(filters => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'or', filters },
        ];
        return newQuery;
      }),

      filter: jest.fn().mockImplementation((column, operator, value) => {
        const newQuery = createQueryObject(table);
        newQuery._filters = [
          ...(newQuery._filters || []),
          { type: 'filter', column, operator, value },
        ];
        return newQuery;
      }),

      // Ordering methods
      order: jest.fn().mockImplementation(function (column, options) {
        const newQuery = createQueryObject(table);
        newQuery._orderBy = { column, options };
        // Copy over existing filters and other properties
        newQuery._filters = this._filters || [];
        newQuery._selectColumns = this._selectColumns;
        newQuery._limit = this._limit;
        newQuery._range = this._range;
        return newQuery;
      }),

      // Limit/offset methods
      limit: jest.fn().mockImplementation(count => {
        const newQuery = createQueryObject(table);
        newQuery._limit = count;
        return newQuery;
      }),

      range: jest.fn().mockImplementation(function (from, to) {
        const newQuery = createQueryObject(table);
        newQuery._range = { from, to };
        // Copy over existing filters and other properties
        newQuery._filters = this._filters || [];
        newQuery._selectColumns = this._selectColumns;
        newQuery._limit = this._limit;
        newQuery._orderBy = this._orderBy;
        return newQuery;
      }),

      // Execution methods that return promises
      single: jest.fn().mockImplementation(function () {
        // Check if this is an insert operation
        if (this._insertData) {
          return Promise.resolve({
            data: { id: 'new-contact-id' },
            error: null,
          });
        }

        // For contact verification queries, return a valid contact
        if (this._filters && this._filters.some(f => f.column === 'id')) {
          return Promise.resolve({
            data: {
              id: 'test-contact-id',
              user_id: 'test-user-id',
              contact_user_id: 'contact-user-1',
              contact_type: 'client',
              relationship_status: 'active',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              company: 'Test Company',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_interaction: '2024-01-01T00:00:00Z',
              interaction_count: 1,
            },
            error: null,
          });
        }

        // For existing contact checks, return null data
        if (
          this._filters &&
          this._filters.some(f => f.column === 'contact_user_id')
        ) {
          return Promise.resolve({
            data: null,
            error: null,
          });
        }

        // Return appropriate data based on table
        let mockData = { id: 'test-id', table };
        if (table === 'contact_notes') {
          mockData = {
            id: 'test-id',
            user_id: 'test-user-id',
            contact_id: '550e8400-e29b-41d4-a716-446655440000',
            note_type: 'general',
            note_content: 'Test note content',
            is_important: false,
            tags: [],
            created_at: '2024-12-22T10:00:00Z',
          };
        } else if (table === 'contacts') {
          mockData = {
            id: 'test-id',
            user_id: 'test-user-id',
            contact_user_id: 'user-123',
            contact_type: 'client',
            relationship_status: 'active',
            created_at: '2024-12-22T10:00:00Z',
            updated_at: '2024-12-22T10:00:00Z',
          };
        }

        return Promise.resolve({
          data: mockData,
          error: null,
        });
      }),

      maybeSingle: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: { id: 'test-id', table },
          error: null,
        });
      }),

      then: jest.fn().mockImplementation((onFulfilled, onRejected) => {
        // Return appropriate data based on table
        let mockData = [];
        if (table === 'contacts') {
          mockData = [
            {
              id: 'contact-1',
              user_id: 'test-user-id',
              contact_user_id: 'contact-user-1',
              contact_type: 'client',
              relationship_status: 'active',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              company: 'Test Company',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_interaction: '2024-01-01T00:00:00Z',
              interaction_count: 5,
            },
          ];
        } else if (table === 'contact_messages') {
          mockData = [
            {
              id: 'message-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              message_type: 'email',
              subject: 'Test Message',
              content: 'Test message content',
              is_read: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else if (table === 'contact_notes') {
          mockData = [
            {
              id: 'note-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              note_type: 'general',
              content: 'Test note content',
              is_important: false,
              tags: ['test'],
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else if (table === 'contact_reminders') {
          mockData = [
            {
              id: 'reminder-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              reminder_type: 'follow_up',
              title: 'Test Reminder',
              description: 'Test reminder description',
              due_date: '2024-01-15T00:00:00Z',
              is_completed: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else {
          mockData = [{ id: 'test-id', table }];
        }

        return Promise.resolve({
          data: mockData,
          error: null,
        }).then(onFulfilled, onRejected);
      }),

      // Additional execution methods
      execute: jest.fn().mockImplementation(() => {
        // Return appropriate data based on table
        let mockData = [];
        if (table === 'contacts') {
          mockData = [
            {
              id: 'contact-1',
              user_id: 'test-user-id',
              contact_user_id: 'contact-user-1',
              contact_type: 'client',
              relationship_status: 'active',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              company: 'Test Company',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_interaction: '2024-01-01T00:00:00Z',
              interaction_count: 5,
            },
          ];
        } else if (table === 'contact_messages') {
          mockData = [
            {
              id: 'message-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              message_type: 'email',
              subject: 'Test Message',
              content: 'Test message content',
              is_read: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else if (table === 'contact_notes') {
          mockData = [
            {
              id: 'note-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              note_type: 'general',
              content: 'Test note content',
              is_important: false,
              tags: ['test'],
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else if (table === 'contact_reminders') {
          mockData = [
            {
              id: 'reminder-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              reminder_type: 'follow_up',
              title: 'Test Reminder',
              description: 'Test reminder description',
              due_date: '2024-01-15T00:00:00Z',
              is_completed: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        } else {
          mockData = [{ id: 'test-id', table }];
        }

        return Promise.resolve({
          data: mockData,
          error: null,
        });
      }),

      // Abort signal support
      abortSignal: jest.fn().mockImplementation(signal => {
        const newQuery = createQueryObject(table);
        newQuery._abortSignal = signal;
        return newQuery;
      }),

      // Explain method
      explain: jest.fn().mockImplementation(options => {
        return Promise.resolve({
          data: { query: 'SELECT * FROM ' + table },
          error: null,
        });
      }),

      // Rollback method
      rollback: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: null,
        });
      }),

      // Commit method
      commit: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: null,
        });
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

    return queryObject;
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

export const createErrorSupabaseMock = () => {
  const createQueryObject = (table: string) => {
    return {
      select: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      insert: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      update: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      delete: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      eq: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      single: jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed')),
      then: jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed')),
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed')),
    };
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      const queryObject = createQueryObject(table);

      // Track method calls to handle different operation types
      let methodCallCount = 0;
      let currentOperation = '';

      // Override methods to track the operation flow
      const originalSelect = queryObject.select;
      const originalInsert = queryObject.insert;
      const originalUpdate = queryObject.update;
      const originalDelete = queryObject.delete;
      const originalEq = queryObject.eq;
      const originalSingle = queryObject.single;

      queryObject.select = jest.fn().mockImplementation((...args) => {
        currentOperation = 'select';
        methodCallCount = 0;
        return queryObject;
      });

      queryObject.insert = jest.fn().mockImplementation((...args) => {
        currentOperation = 'insert';
        methodCallCount = 0;
        return queryObject;
      });

      queryObject.update = jest.fn().mockImplementation((...args) => {
        currentOperation = 'update';
        methodCallCount = 0;
        return queryObject;
      });

      queryObject.delete = jest.fn().mockImplementation((...args) => {
        currentOperation = 'delete';
        methodCallCount = 0;
        return queryObject;
      });

      queryObject.eq = jest.fn().mockImplementation((column, value) => {
        methodCallCount++;

        // For DELETE operations, return promise on second .eq() call
        if (currentOperation === 'delete' && methodCallCount === 2) {
          return Promise.resolve({
            data: null,
            error: null,
          });
        }

        // For other operations, continue chaining
        return queryObject;
      });

      queryObject.single = jest.fn().mockImplementation(() => {
        // Return appropriate promise based on operation
        if (currentOperation === 'insert') {
          return Promise.resolve({
            data: { id: 'new-contact-id' },
            error: null,
          });
        } else if (currentOperation === 'update') {
          return Promise.resolve({
            data: { id: 'updated-contact-id' },
            error: null,
          });
        } else {
          return Promise.resolve({
            data: { id: 'test-contact-id' },
            error: null,
          });
        }
      });

      return queryObject;
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    rpc: jest.fn().mockRejectedValue(new Error('RPC function not found')),
  };
};

export const createConnectionFailureSupabaseMock = () => {
  const createQueryObject = (table: string) => {
    return {
      select: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      insert: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      update: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      delete: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      eq: jest.fn().mockImplementation(() => {
        const newQuery = createQueryObject(table);
        return newQuery;
      }),
      single: jest.fn().mockRejectedValue(new Error('Connection failed')),
      then: jest.fn().mockRejectedValue(new Error('Connection failed')),
      execute: jest.fn().mockRejectedValue(new Error('Connection failed')),
    };
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      return createQueryObject(table);
    }),
    auth: {
      getUser: jest.fn().mockRejectedValue(new Error('Connection failed')),
    },
    rpc: jest.fn().mockRejectedValue(new Error('Connection failed')),
  };
};
