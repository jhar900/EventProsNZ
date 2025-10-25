import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/legal/terms/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(),
};

describe('/api/legal/terms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/legal/terms', () => {
    it('returns terms of service successfully', async () => {
      const mockTerms = {
        id: 'terms-1',
        title: 'Terms of Service v1.0',
        content: 'Terms content...',
        version: '1.0',
        effective_date: '2024-12-19T00:00:00Z',
        updated_at: '2024-12-19T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTerms,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: mockTerms.id,
        title: mockTerms.title,
        content: mockTerms.content,
        version: mockTerms.version,
        effective_date: mockTerms.effective_date,
        last_updated: mockTerms.updated_at,
      });
    });

    it('returns 404 when terms not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Terms of service not found');
    });

    it('returns 500 when database error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch terms of service');
    });

    it('returns 500 when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
