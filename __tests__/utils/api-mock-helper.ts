// Comprehensive API mock helper for all AI API tests
export class APIMockHelper {
  private mockSupabaseClient: any;
  private mockRequest: any;

  constructor() {
    this.setupMocks();
  }

  private setupMocks() {
    // Mock Supabase client with proper chaining
    this.mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn((table: string) => ({
        select: jest.fn((columns?: string) => ({
          eq: jest.fn((column: string, value: any) => ({
            order: jest.fn((column: string, options?: any) => ({
              limit: jest.fn((count: number) =>
                Promise.resolve({ data: [], error: null })
              ),
            })),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          gte: jest.fn((column: string, value: any) => ({
            order: jest.fn((column: string, options?: any) => ({
              limit: jest.fn((count: number) =>
                Promise.resolve({ data: [], error: null })
              ),
            })),
            eq: jest.fn((column: string, value: any) => ({
              order: jest.fn((column: string, options?: any) => ({
                limit: jest.fn((count: number) =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
        })),
        insert: jest.fn((data: any) =>
          Promise.resolve({ data: [], error: null })
        ),
        update: jest.fn((data: any) => ({
          eq: jest.fn((column: string, value: any) =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn((column: string, value: any) =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
      })),
    };

    // Mock NextRequest
    this.mockRequest = (url: string, options: any = {}) => {
      const request = new (require('next/server').NextRequest)(url, options);
      request.json = jest
        .fn()
        .mockResolvedValue(JSON.parse(options.body || '{}'));
      return request;
    };

    // Apply the mock
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => this.mockSupabaseClient),
    }));
  }

  // Helper methods for common test patterns
  setAuthUser(user: any) {
    this.mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
  }

  setAuthError(error: any) {
    this.mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error,
    });
  }

  setQueryResult(table: string, method: string, data: any, error: any = null) {
    // This is a simplified approach - in practice, you'd need to set up the specific chain
    const mockLimit = jest.fn();
    const mockOrder = jest.fn(() => ({ limit: mockLimit }));
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));

    this.mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
    mockLimit.mockResolvedValue({ data, error });
  }

  setInsertResult(table: string, data: any, error: any = null) {
    this.mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data, error }),
    });
  }

  setUpdateResult(table: string, data: any, error: any = null) {
    this.mockSupabaseClient.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data, error }),
      }),
    });
  }

  setDeleteResult(table: string, data: any, error: any = null) {
    this.mockSupabaseClient.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data, error }),
      }),
    });
  }

  createRequest(url: string, options: any = {}) {
    return this.mockRequest(url, options);
  }

  clearMocks() {
    jest.clearAllMocks();
  }

  get client() {
    return this.mockSupabaseClient;
  }
}

// Export a singleton instance
export const apiMockHelper = new APIMockHelper();
