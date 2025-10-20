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
        // For array queries (no .single() call)
        mockQuery.select.mockResolvedValue({
          data: [
            {
              id: 'test-user-id',
              email: 'test@example.com',
              role: 'contractor',
            },
          ],
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
      } else if (table === 'documents') {
        mockQuery.single.mockResolvedValue({
          data: {
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
          },
          error: null,
        });
        // For array queries (no .single() call)
        mockQuery.select.mockResolvedValue({
          data: [
            {
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
            },
          ],
          error: null,
        });
      } else if (table === 'document_shares') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'test-share-id',
            document_id: 'test-document-id',
            shared_by: 'test-user-id',
            shared_with: 'user-123',
            permission_level: 'read',
            expires_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          error: null,
        });
        // For array queries (no .single() call)
        mockQuery.select.mockResolvedValue({
          data: [
            {
              id: 'test-share-id',
              document_id: 'test-document-id',
              shared_by: 'test-user-id',
              shared_with: 'user-123',
              permission_level: 'read',
              expires_at: null,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        });
      } else if (table === 'document_versions') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'test-version-id',
            document_id: 'test-document-id',
            version_number: 1,
            file_path: 'documents/versions/test-file-v1.pdf',
            file_size: 1000,
            change_summary: 'Initial version',
            created_by: 'test-user-id',
            created_at: new Date().toISOString(),
          },
          error: null,
        });
        // For array queries (no .single() call)
        mockQuery.select.mockResolvedValue({
          data: [
            {
              id: 'test-version-id',
              document_id: 'test-document-id',
              version_number: 1,
              file_path: 'documents/versions/test-file-v1.pdf',
              file_size: 1000,
              change_summary: 'Initial version',
              created_by: 'test-user-id',
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        });
      } else if (table === 'document_access') {
        mockQuery.single.mockResolvedValue({
          data: {
            id: 'test-access-id',
            document_id: 'test-document-id',
            user_id: 'test-user-id',
            access_type: 'read',
            granted_by: 'test-user-id',
            granted_at: new Date().toISOString(),
            expires_at: null,
            is_active: true,
          },
          error: null,
        });
        // For array queries (no .single() call)
        mockQuery.select.mockResolvedValue({
          data: [
            {
              id: 'test-access-id',
              document_id: 'test-document-id',
              user_id: 'test-user-id',
              access_type: 'read',
              granted_by: 'test-user-id',
              granted_at: new Date().toISOString(),
              expires_at: null,
              is_active: true,
            },
          ],
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
