import { NextRequest } from 'next/server';
import { GET as searchGET } from '@/app/api/contractors/search/route';
import { GET as filtersGET } from '@/app/api/contractors/filters/route';
import { GET as suggestionsGET } from '@/app/api/contractors/suggestions/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        in: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn(() => ({
              order: jest.fn(() => ({
                order: jest.fn(() => ({
                  data: [],
                  error: null,
                  count: 0,
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    not: jest.fn(() => ({
      ilike: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
};

describe('Search API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('/api/contractors/search', () => {
    it('should handle basic search without filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?q=photography'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('contractors');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
    });

    it('should handle search with multiple filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?q=photography&service_types=catering,music&location=Auckland&price_min=100&price_max=1000&rating_min=4&sort=rating'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.searchQuery).toHaveProperty('q', 'photography');
      expect(data.searchQuery).toHaveProperty('serviceTypes', [
        'catering',
        'music',
      ]);
      expect(data.searchQuery).toHaveProperty('location', 'Auckland');
      expect(data.searchQuery).toHaveProperty('priceMin', 100);
      expect(data.searchQuery).toHaveProperty('priceMax', 1000);
      expect(data.searchQuery).toHaveProperty('ratingMin', 4);
      expect(data.searchQuery).toHaveProperty('sortBy', 'rating');
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?page=2&limit=6'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBe(2);
      expect(data.limit).toBe(6);
    });

    it('should limit maximum results per page', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?limit=100'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBeLessThanOrEqual(50);
    });

    it('should handle empty search results', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?q=nonexistent'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractors).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/search?q=test'
      );
      const response = await searchGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('/api/contractors/filters', () => {
    it('should return filter options', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          not: jest.fn(() => ({
            data: [
              { service_categories: ['catering', 'photography'] },
              { service_categories: ['music', 'decorations'] },
            ],
            error: null,
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/filters'
      );
      const response = await filtersGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('service_types');
      expect(data).toHaveProperty('regions');
      expect(data).toHaveProperty('price_ranges');
      expect(data).toHaveProperty('rating_ranges');
    });

    it('should handle empty filter data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          not: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/filters'
      );
      const response = await filtersGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service_types).toEqual([]);
      expect(data.regions).toEqual([]);
    });
  });

  describe('/api/contractors/suggestions', () => {
    it('should return suggestions for valid query', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          ilike: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [
                { company_name: 'Photography Pro' },
                { company_name: 'Photo Studio' },
              ],
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/contractors/suggestions?q=photo&limit=5'
      );
      const response = await suggestionsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('suggestions');
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    it('should return empty suggestions for short query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/suggestions?q=a'
      );
      const response = await suggestionsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([]);
    });

    it('should return empty suggestions for empty query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/contractors/suggestions'
      );
      const response = await suggestionsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([]);
    });
  });
});
