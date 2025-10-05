/**
 * Comprehensive Fixed Supabase Mock
 *
 * This mock addresses all the test infrastructure issues identified in the QA gate:
 * - Database connection failures
 * - RPC function missing errors
 * - Method chaining issues
 * - Console error spam
 */

export const createComprehensiveFixedSupabaseMock = () => {
  // Mock data for different tables
  const mockData = {
    trial_conversions: [
      {
        id: 'conv-1',
        user_id: 'user-1',
        trial_start_date: '2024-01-01T00:00:00Z',
        trial_end_date: '2024-01-15T00:00:00Z',
        conversion_status: 'active',
        conversion_date: null,
        conversion_tier: null,
        conversion_reason: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    trial_emails: [
      {
        id: 'email-1',
        user_id: 'user-1',
        email_type: 'day_2',
        scheduled_date: '2024-01-03T00:00:00Z',
        sent_date: '2024-01-03T00:00:00Z',
        email_status: 'sent',
        email_content: { subject: 'Welcome to your trial!' },
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    trial_analytics: [
      {
        id: 'analytics-1',
        user_id: 'user-1',
        trial_day: 1,
        feature_usage: { profile_views: 5, search_queries: 3 },
        platform_engagement: { time_spent: 1200, pages_visited: 8 },
        conversion_likelihood: 0.75,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  // RPC function responses
  const rpcResponses = {
    get_trial_conversion_metrics: {
      total_trials: 100,
      converted_trials: 25,
      expired_trials: 60,
      conversion_rate: 0.25,
      avg_trial_duration: 12.5,
    },
    get_trial_analytics: {
      total_analytics: 50,
      avg_engagement: 0.65,
      top_features: ['search', 'profile', 'matching'],
    },
    get_trial_insights: {
      insights: [
        {
          type: 'conversion_tip',
          message: 'Complete your profile to increase conversion chances',
        },
        { type: 'engagement_tip', message: 'Try the advanced search features' },
      ],
    },
  };

  // Create a robust query object that handles all method chaining
  const createRobustQueryObject = (table: string) => {
    const queryState = {
      table,
      operation: null,
      filters: [],
      data: null,
      columns: '*',
      single: false,
    };

    const queryObject = {
      // Query methods
      select: jest.fn().mockImplementation((columns = '*') => {
        queryState.columns = columns;
        return queryObject;
      }),

      insert: jest.fn().mockImplementation(data => {
        queryState.operation = 'insert';
        queryState.data = data;
        return queryObject;
      }),

      update: jest.fn().mockImplementation(data => {
        queryState.operation = 'update';
        queryState.data = data;
        return queryObject;
      }),

      delete: jest.fn().mockImplementation(() => {
        queryState.operation = 'delete';
        return queryObject;
      }),

      // Filter methods
      eq: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'eq', column, value });
        return queryObject;
      }),

      neq: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'neq', column, value });
        return queryObject;
      }),

      gt: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'gt', column, value });
        return queryObject;
      }),

      gte: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'gte', column, value });
        return queryObject;
      }),

      lt: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'lt', column, value });
        return queryObject;
      }),

      lte: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'lte', column, value });
        return queryObject;
      }),

      like: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'like', column, value });
        return queryObject;
      }),

      ilike: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'ilike', column, value });
        return queryObject;
      }),

      in: jest.fn().mockImplementation((column, values) => {
        queryState.filters.push({ type: 'in', column, values });
        return queryObject;
      }),

      is: jest.fn().mockImplementation((column, value) => {
        queryState.filters.push({ type: 'is', column, value });
        return queryObject;
      }),

      // Other query methods
      order: jest.fn().mockImplementation((column, options) => {
        return queryObject;
      }),

      limit: jest.fn().mockImplementation(count => {
        return queryObject;
      }),

      range: jest.fn().mockImplementation((from, to) => {
        return queryObject;
      }),

      single: jest.fn().mockImplementation(() => {
        queryState.single = true;
        return queryObject;
      }),

      // Execute the query
      then: jest.fn().mockImplementation((resolve, reject) => {
        try {
          const result = executeQuery(queryState);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }),

      // Support for async/await
      catch: jest.fn().mockImplementation(reject => {
        return queryObject;
      }),
    };

    return queryObject;
  };

  // Execute the query based on the query state
  const executeQuery = (queryState: any) => {
    const { table, operation, filters, data, columns, single } = queryState;

    // Get table data
    let tableData = mockData[table] || [];

    // Apply filters
    if (filters.length > 0) {
      tableData = tableData.filter((row: any) => {
        return filters.every((filter: any) => {
          switch (filter.type) {
            case 'eq':
              return row[filter.column] === filter.value;
            case 'neq':
              return row[filter.column] !== filter.value;
            case 'gt':
              return row[filter.column] > filter.value;
            case 'gte':
              return row[filter.column] >= filter.value;
            case 'lt':
              return row[filter.column] < filter.value;
            case 'lte':
              return row[filter.column] <= filter.value;
            case 'like':
              return row[filter.column]?.includes(filter.value);
            case 'ilike':
              return row[filter.column]
                ?.toLowerCase()
                .includes(filter.value.toLowerCase());
            case 'in':
              return filter.values.includes(row[filter.column]);
            case 'is':
              return row[filter.column] === filter.value;
            default:
              return true;
          }
        });
      });
    }

    // Handle operations
    if (operation === 'insert') {
      const newRecord = {
        id: `new-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockData[table].push(newRecord);
      return { data: single ? newRecord : [newRecord], error: null };
    }

    if (operation === 'update') {
      if (tableData.length > 0) {
        const updatedRecord = {
          ...tableData[0],
          ...data,
          updated_at: new Date().toISOString(),
        };
        const index = mockData[table].findIndex(
          (row: any) => row.id === tableData[0].id
        );
        if (index !== -1) {
          mockData[table][index] = updatedRecord;
        }
        return { data: single ? updatedRecord : [updatedRecord], error: null };
      }
      return { data: single ? null : [], error: null };
    }

    if (operation === 'delete') {
      if (tableData.length > 0) {
        const deletedRecord = tableData[0];
        const index = mockData[table].findIndex(
          (row: any) => row.id === deletedRecord.id
        );
        if (index !== -1) {
          mockData[table].splice(index, 1);
        }
        return { data: single ? deletedRecord : [deletedRecord], error: null };
      }
      return { data: single ? null : [], error: null };
    }

    // Default select operation
    return {
      data: single ? (tableData.length > 0 ? tableData[0] : null) : tableData,
      error: null,
    };
  };

  // Create the main Supabase mock
  const supabaseMock = {
    from: jest.fn().mockImplementation((table: string) => {
      return createRobustQueryObject(table);
    }),

    rpc: jest.fn().mockImplementation((functionName: string, params = {}) => {
      // Return a promise that resolves with the RPC response
      return Promise.resolve({
        data: rpcResponses[functionName] || null,
        error: null,
      });
    }),

    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
      signIn: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },

    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest
          .fn()
          .mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: jest
          .fn()
          .mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/test' } }),
      }),
    },

    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { result: 'success' },
        error: null,
      }),
    },

    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockReturnThis(),
    }),
  };

  return supabaseMock;
};

// Export a default instance
export const comprehensiveFixedSupabaseMock =
  createComprehensiveFixedSupabaseMock();
