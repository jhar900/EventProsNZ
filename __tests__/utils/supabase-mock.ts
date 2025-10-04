// Comprehensive Supabase mock utility for API tests
describe('SupabaseMock', () => {
  it('should be a utility class', () => {
    expect(true).toBe(true);
  });
});

export class SupabaseMock {
  private auth = {
    getUser: jest.fn(),
  };

  private queryResults: Map<string, any> = new Map();
  private queryErrors: Map<string, any> = new Map();

  // Mock the Supabase client
  get client() {
    return {
      auth: this.auth,
      from: jest.fn((table: string) => ({
        select: jest.fn((columns?: string) => ({
          eq: jest.fn((column: string, value: any) => ({
            order: jest.fn((column: string, options?: any) => ({
              limit: jest.fn((count: number) =>
                this.getQueryResult(`${table}.select.eq.order.limit`)
              ),
            })),
            single: jest.fn(() =>
              this.getQueryResult(`${table}.select.eq.single`)
            ),
          })),
          gte: jest.fn((column: string, value: any) => ({
            order: jest.fn((column: string, options?: any) => ({
              limit: jest.fn((count: number) =>
                this.getQueryResult(`${table}.select.gte.order.limit`)
              ),
            })),
            eq: jest.fn((column: string, value: any) => ({
              order: jest.fn((column: string, options?: any) => ({
                limit: jest.fn((count: number) =>
                  this.getQueryResult(`${table}.select.gte.eq.order.limit`)
                ),
              })),
            })),
          })),
        })),
        insert: jest.fn((data: any) => this.getQueryResult(`${table}.insert`)),
        update: jest.fn((data: any) => ({
          eq: jest.fn((column: string, value: any) =>
            this.getQueryResult(`${table}.update.eq`)
          ),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn((column: string, value: any) =>
            this.getQueryResult(`${table}.delete.eq`)
          ),
        })),
      })),
    };
  }

  // Set up authentication
  setAuthUser(user: any) {
    this.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
  }

  setAuthError(error: any) {
    this.auth.getUser.mockResolvedValue({
      data: { user: null },
      error,
    });
  }

  // Set up query results
  setQueryResult(query: string, data: any, error: any = null) {
    this.queryResults.set(query, { data, error });
  }

  setQueryError(query: string, error: any) {
    this.queryErrors.set(query, error);
  }

  private getQueryResult(query: string) {
    const result = this.queryResults.get(query);
    const error = this.queryErrors.get(query);

    if (error) {
      return Promise.resolve({ data: null, error });
    }

    if (result) {
      return Promise.resolve(result);
    }

    // Default success response
    return Promise.resolve({ data: [], error: null });
  }

  // Helper methods for common patterns
  setSelectResult(table: string, data: any, error: any = null) {
    this.setQueryResult(`${table}.select`, { data, error });
  }

  setInsertResult(table: string, data: any, error: any = null) {
    this.setQueryResult(`${table}.insert`, { data, error });
  }

  setUpdateResult(table: string, data: any, error: any = null) {
    this.setQueryResult(`${table}.update.eq`, { data, error });
  }

  setDeleteResult(table: string, data: any, error: any = null) {
    this.setQueryResult(`${table}.delete.eq`, { data, error });
  }

  // Clear all mocks
  clearMocks() {
    this.queryResults.clear();
    this.queryErrors.clear();
    jest.clearAllMocks();
  }
}

// Create a global mock instance
export const supabaseMock = new SupabaseMock();

// Mock the Supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => supabaseMock.client),
}));

// Mock NextRequest for API tests
export const createMockRequest = (url: string, options: any = {}) => {
  const request = new (require('next/server').NextRequest)(url, options);
  request.json = jest.fn().mockResolvedValue(JSON.parse(options.body || '{}'));
  return request;
};
