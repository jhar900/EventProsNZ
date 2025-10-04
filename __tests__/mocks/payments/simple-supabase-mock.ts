/**
 * Simplified Supabase Mock
 * Provides reliable, simple mocking for payment tests
 */

export const createSimpleSupabaseMock = () => {
  const mockData = {
    users: [{ id: 'user_123', email: 'test@example.com', role: 'contractor' }],
    subscriptions: [
      { id: 'sub_123', user_id: 'user_123', status: 'active', tier: 'premium' },
    ],
    payments: [
      {
        id: 'payment_123',
        subscription_id: 'sub_123',
        amount: 29.99,
        status: 'succeeded',
      },
    ],
    payment_methods: [
      { id: 'pm_123', user_id: 'user_123', type: 'card', last_four: '4242' },
    ],
    failed_payments: [
      {
        id: 'failed_123',
        payment_id: 'payment_123',
        failure_count: 1,
        status: 'active',
      },
    ],
  };

  const createQueryMock = (table: string) => {
    const data = mockData[table] || [];

    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: data[0] || null, error: null }),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: data[0] || null, error: null }),
      then: jest.fn().mockImplementation(resolve => {
        if (resolve) {
          return Promise.resolve(resolve({ data, error: null }));
        }
        return Promise.resolve({ data, error: null });
      }),
    };
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: { user: { id: 'user_123', email: 'test@example.com' } },
        },
        error: null,
      }),
    },
    from: jest.fn((table: string) => createQueryMock(table)),
  };
};

export const mockSupabaseClient = createSimpleSupabaseMock();

// Add a simple test to make this file valid for Jest
describe('Simple Supabase Mock', () => {
  it('should create mock client', () => {
    const mock = createSimpleSupabaseMock();
    expect(mock).toBeDefined();
    expect(mock.from).toBeDefined();
    expect(mock.auth).toBeDefined();
  });
});
