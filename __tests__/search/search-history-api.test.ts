import { NextRequest } from 'next/server';
import {
  GET as historyGET,
  POST as historyPOST,
} from '@/app/api/search/history/route';
import {
  GET as savedGET,
  POST as savedPOST,
  DELETE as savedDELETE,
} from '@/app/api/search/saved/route';
import {
  GET as favoritesGET,
  POST as favoritesPOST,
  DELETE as favoritesDELETE,
} from '@/app/api/search/favorites/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'test-id',
            search_query: 'test',
            created_at: new Date().toISOString(),
          },
          error: null,
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null,
        })),
      })),
    })),
  })),
};

describe('Search History API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('/api/search/history', () => {
    it('should get search history for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                data: [
                  {
                    id: 'search-1',
                    search_query: 'photography',
                    filters: { serviceTypes: ['photography'] },
                    result_count: 5,
                    created_at: new Date().toISOString(),
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/history?limit=10&offset=0'
      );
      const response = await historyGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('searches');
      expect(Array.isArray(data.searches)).toBe(true);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/history'
      );
      const response = await historyGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should save search history', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/history',
        {
          method: 'POST',
          body: JSON.stringify({
            search_query: 'photography',
            filters: { serviceTypes: ['photography'] },
            result_count: 5,
          }),
        }
      );

      const response = await historyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('search_entry');
    });

    it('should return 400 for missing search query', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/history',
        {
          method: 'POST',
          body: JSON.stringify({
            filters: { serviceTypes: ['photography'] },
            result_count: 5,
          }),
        }
      );

      const response = await historyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Search query is required');
    });
  });

  describe('/api/search/saved', () => {
    it('should get saved searches for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                {
                  id: 'saved-1',
                  name: 'Photography Search',
                  search_query: 'photography',
                  filters: { serviceTypes: ['photography'] },
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/search/saved');
      const response = await savedGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('saved_searches');
      expect(Array.isArray(data.saved_searches)).toBe(true);
    });

    it('should save a new search', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/saved',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Photography Search',
            search_query: 'photography',
            filters: { serviceTypes: ['photography'] },
          }),
        }
      );

      const response = await savedPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('saved_search');
    });

    it('should return 400 for missing required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/saved',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Photography Search',
          }),
        }
      );

      const response = await savedPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty(
        'error',
        'Name and search query are required'
      );
    });

    it('should delete a saved search', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/saved?id=saved-123'
      );
      const response = await savedDELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
    });

    it('should return 400 for missing search ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/search/saved');
      const response = await savedDELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Search ID is required');
    });
  });

  describe('/api/search/favorites', () => {
    it('should get favorites for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                {
                  id: 'favorite-1',
                  contractor_id: 'contractor-123',
                  created_at: new Date().toISOString(),
                  users: {
                    id: 'contractor-123',
                    profiles: { first_name: 'John', last_name: 'Doe' },
                    business_profiles: { company_name: 'Test Company' },
                    services: [],
                  },
                },
              ],
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/favorites'
      );
      const response = await favoritesGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('favorites');
      expect(Array.isArray(data.favorites)).toBe(true);
    });

    it('should add contractor to favorites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock contractor exists check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    id: 'contractor-123',
                    role: 'contractor',
                    is_verified: true,
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      });

      // Mock existing favorite check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: 'PGRST116' }, // No rows returned
              })),
            })),
          })),
        })),
      });

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'favorite-123',
                user_id: 'user-123',
                contractor_id: 'contractor-123',
              },
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/favorites',
        {
          method: 'POST',
          body: JSON.stringify({
            contractor_id: 'contractor-123',
          }),
        }
      );

      const response = await favoritesPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('favorite');
    });

    it('should return 400 for missing contractor ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/favorites',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await favoritesPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Contractor ID is required');
    });

    it('should remove contractor from favorites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search/favorites?contractor_id=contractor-123'
      );
      const response = await favoritesDELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
    });
  });
});
