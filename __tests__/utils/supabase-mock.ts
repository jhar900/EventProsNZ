import { jest } from '@jest/globals';

export class SupabaseMock {
  private authUser: any = null;
  private mockData: Record<string, any> = {};
  private mockErrors: Record<string, any> = {};
  private queryChain: Record<string, string> = {};
  private currentQuery: string = '';

  setAuthUser(user: any) {
    this.authUser = user;
  }

  setSelectResult(table: string, data: any) {
    this.mockData[`${table}.select`] = data;
  }

  setSelectResultForQuery(query: string, data: any) {
    this.mockData[query] = data;
  }

  setSelectResultForQueryWithSingle(query: string, data: any) {
    this.mockData[`${query}.single`] = data;
  }

  // Direct method to set up mock data for specific query patterns
  setMockDataForQuery(query: string, data: any) {
    this.mockData[query] = data;
  }

  setInsertResult(table: string, data: any) {
    this.mockData[`${table}.insert`] = data;
  }

  setUpdateResult(table: string, data: any) {
    this.mockData[`${table}.update`] = data;
  }

  setDeleteResult(table: string, data: any) {
    this.mockData[`${table}.delete`] = data;
  }

  setQueryError(query: string, error: any) {
    this.mockErrors[query] = error;
  }

  clearMocks() {
    this.authUser = null;
    this.mockData = {};
    this.mockErrors = {};
    this.queryChain = {};
    this.currentQuery = '';
  }

  getDefaultDataForTable(table: string): any {
    switch (table) {
      case 'documents':
        return {
          id: 'test-document-id',
          user_id: 'test-user-id',
          document_name: 'Test Document',
          document_type: 'application/pdf',
          file_size: 1000,
          file_path: 'documents/test-file.pdf',
          mime_type: 'application/pdf',
          document_category: 'contract',
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      case 'document_shares':
        return {
          id: 'test-share-id',
          document_id: 'test-document-id',
          shared_by: 'test-user-id',
          shared_with: 'test-share-user-id',
          permission_level: 'read',
          expires_at: null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
      case 'document_versions':
        return {
          id: 'test-version-id',
          document_id: 'test-document-id',
          version_number: 1,
          file_path: 'documents/versions/test-file-v1.pdf',
          file_size: 1000,
          change_summary: 'Initial version',
          created_by: 'test-user-id',
          created_at: new Date().toISOString(),
        };
      case 'document_access':
        return {
          id: 'test-access-id',
          document_id: 'test-document-id',
          user_id: 'test-user-id',
          access_type: 'read',
          granted_by: 'test-user-id',
          granted_at: new Date().toISOString(),
          expires_at: null,
          is_active: true,
          document: {
            user_id: 'test-user-id',
          },
        };
      case 'users':
        return {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'event_manager',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      default:
        return {
          id: 'test-id',
          table,
          created_at: new Date().toISOString(),
        };
    }
  }

  getClient() {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: this.authUser },
          error: this.authUser ? null : { message: 'Not authenticated' },
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: this.authUser,
            session: { access_token: 'mock-token' },
          },
          error: null,
        }),
        signUp: jest.fn().mockResolvedValue({
          data: { user: this.authUser },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        refreshSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'new-mock-token' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const queryId = `${table}_${Date.now()}_${Math.random()}`;
        this.queryChain[queryId] = table;
        this.currentQuery = table;

        const mockQuery = {
          select: jest.fn().mockImplementation((columns = '*') => {
            this.queryChain[queryId] = `${table}.select`;
            this.currentQuery = `${table}.select`;
            return mockQuery;
          }),
          insert: jest.fn().mockImplementation(data => {
            this.queryChain[queryId] = `${table}.insert`;
            this.currentQuery = `${table}.insert`;
            return mockQuery;
          }),
          update: jest.fn().mockImplementation(data => {
            this.queryChain[queryId] = `${table}.update`;
            this.currentQuery = `${table}.update`;
            return mockQuery;
          }),
          delete: jest.fn().mockImplementation(() => {
            this.queryChain[queryId] = `${table}.delete`;
            this.currentQuery = `${table}.delete`;
            return mockQuery;
          }),
          eq: jest.fn().mockImplementation((column, value) => {
            this.queryChain[queryId] = `${this.queryChain[queryId]}.eq`;
            this.currentQuery = `${this.currentQuery}.eq`;
            return mockQuery;
          }),
          order: jest.fn().mockImplementation((column, options) => {
            this.queryChain[queryId] = `${this.queryChain[queryId]}.order`;
            this.currentQuery = `${this.currentQuery}.order`;
            return mockQuery;
          }),
          limit: jest.fn().mockImplementation(count => {
            this.queryChain[queryId] = `${this.queryChain[queryId]}.limit`;
            this.currentQuery = `${this.currentQuery}.limit`;
            return mockQuery;
          }),
          single: jest.fn().mockImplementation(() => {
            // Check for specific query errors first with .single appended
            const singleQueryKey = `${this.currentQuery}.single`;

            if (this.mockErrors[singleQueryKey]) {
              return Promise.resolve({
                data: null,
                error: this.mockErrors[singleQueryKey],
              });
            }

            const errorKey = this.currentQuery;
            if (this.mockErrors[errorKey]) {
              return Promise.resolve({
                data: null,
                error: this.mockErrors[errorKey],
              });
            }

            // Check for operation-specific data
            const insertKey = `${table}.insert`;
            const updateKey = `${table}.update`;
            const deleteKey = `${table}.delete`;
            const selectKey = `${table}.select`;

            // Check for query with .single appended first (most specific)
            if (this.mockData[singleQueryKey]) {
              return Promise.resolve({
                data: this.mockData[singleQueryKey],
                error: null,
              });
            }

            // Check for select data (common case)
            if (this.mockData[selectKey]) {
              return Promise.resolve({
                data: this.mockData[selectKey],
                error: null,
              });
            }

            // Check for specific query patterns that match the current query chain
            for (const [key, value] of Object.entries(this.mockData)) {
              if (
                this.currentQuery.includes(key.split('.')[0]) &&
                key.includes('select')
              ) {
                return Promise.resolve({
                  data: value,
                  error: null,
                });
              }
            }

            // Check for full query chain
            if (this.mockData[this.currentQuery]) {
              return Promise.resolve({
                data: this.mockData[this.currentQuery],
                error: null,
              });
            }

            if (this.mockData[insertKey]) {
              return Promise.resolve({
                data: this.mockData[insertKey],
                error: null,
              });
            }

            if (this.mockData[updateKey]) {
              return Promise.resolve({
                data: this.mockData[updateKey],
                error: null,
              });
            }

            if (this.mockData[deleteKey]) {
              return Promise.resolve({
                data: this.mockData[deleteKey],
                error: null,
              });
            }

            // Default response with proper structure based on table
            const defaultData = this.getDefaultDataForTable(table);
            return Promise.resolve({
              data: defaultData,
              error: null,
            });
          }),
          then: jest.fn().mockImplementation(callback => {
            // Check for specific query errors first
            const errorKey = this.currentQuery;
            if (this.mockErrors[errorKey]) {
              return callback({
                data: null,
                error: this.mockErrors[errorKey],
              });
            }

            // Check for operation-specific data
            const insertKey = `${table}.insert`;
            const updateKey = `${table}.update`;
            const deleteKey = `${table}.delete`;
            const selectKey = `${table}.select`;

            // Check for select data first (most common case)
            if (this.mockData[selectKey]) {
              return callback({
                data: this.mockData[selectKey],
                error: null,
              });
            }

            // Check for specific query patterns that match the current query chain
            for (const [key, value] of Object.entries(this.mockData)) {
              if (
                this.currentQuery.includes(key.split('.')[0]) &&
                key.includes('select')
              ) {
                return callback({
                  data: value,
                  error: null,
                });
              }
            }

            if (this.mockData[insertKey]) {
              return callback({
                data: this.mockData[insertKey],
                error: null,
              });
            }

            if (this.mockData[updateKey]) {
              return callback({
                data: this.mockData[updateKey],
                error: null,
              });
            }

            if (this.mockData[deleteKey]) {
              return callback({
                data: this.mockData[deleteKey],
                error: null,
              });
            }

            // Check for full query chain
            if (this.mockData[this.currentQuery]) {
              return callback({
                data: this.mockData[this.currentQuery],
                error: null,
              });
            }

            // For empty results (like no shares), return empty array
            if (
              this.currentQuery.includes('document_shares') &&
              this.currentQuery.includes('select')
            ) {
              return callback({
                data: [],
                error: null,
              });
            }

            const defaultData = this.getDefaultDataForTable(table);
            return callback({
              data: defaultData,
              error: null,
            });
          }),
        };

        return mockQuery;
      }),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'documents/test-file.pdf' },
            error: null,
          }),
          remove: jest.fn().mockResolvedValue({
            data: [{ name: 'test-file.pdf' }],
            error: null,
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/test-file.pdf' },
          }),
        })),
      },
    };
  }
}

export const supabaseMock = new SupabaseMock();
