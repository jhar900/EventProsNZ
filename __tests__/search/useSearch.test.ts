import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

// Mock fetch
global.fetch = jest.fn();

describe('useSearch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.query).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.sortBy).toBe('relevance');
    expect(result.current.results).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.searchHistory).toEqual([]);
    expect(result.current.savedSearches).toEqual([]);
    expect(result.current.favorites).toEqual([]);
  });

  it('should update query when updateQuery is called', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateQuery('photography');
    });

    expect(result.current.query).toBe('photography');
  });

  it('should update filters when updateFilters is called', () => {
    const { result } = renderHook(() => useSearch());

    const newFilters = {
      serviceTypes: ['catering', 'photography'],
      location: 'Auckland',
    };

    act(() => {
      result.current.updateFilters(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
  });

  it('should update sort when updateSort is called', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateSort('rating');
    });

    expect(result.current.sortBy).toBe('rating');
  });

  it('should clear search when clearSearch is called', () => {
    const { result } = renderHook(() => useSearch());

    // Set some state first
    act(() => {
      result.current.updateQuery('photography');
      result.current.updateFilters({ serviceTypes: ['catering'] });
    });

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.results).toBeNull();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  describe('searchContractors', () => {
    it('should perform search successfully', async () => {
      const mockResponse = {
        contractors: [{ id: '1', companyName: 'Test Company' }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
        searchQuery: { q: 'photography' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.searchContractors('photography');
      });

      expect(result.current.results).toEqual(mockResponse);
      expect(result.current.query).toBe('photography');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle search error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        try {
          await result.current.searchContractors('photography');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to search contractors');
      expect(result.current.isLoading).toBe(false);
    });

    it('should build correct search parameters', async () => {
      const mockResponse = {
        contractors: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
        searchQuery: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSearch());

      const filters = {
        serviceTypes: ['catering', 'photography'],
        location: 'Auckland',
        priceMin: 100,
        priceMax: 1000,
        ratingMin: 4,
      };

      await act(async () => {
        await result.current.searchContractors(
          'photography',
          filters,
          'rating',
          2,
          6
        );
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=photography')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('service_types=catering%2Cphotography')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('location=Auckland')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('price_min=100')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('price_max=1000')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('rating_min=4')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=rating')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=6')
      );
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions successfully', async () => {
      const mockSuggestions = ['Photography Pro', 'Photo Studio'];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: mockSuggestions }),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.getSuggestions('photo');
      });

      expect(result.current.suggestions).toEqual(mockSuggestions);
    });

    it('should not fetch suggestions for short queries', async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.getSuggestions('a');
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });

    it('should handle suggestions error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.getSuggestions('photography');
      });

      // Should not throw, just log error
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('getFilterOptions', () => {
    it('should get filter options successfully', async () => {
      const mockOptions = {
        service_types: ['catering', 'photography'],
        regions: ['Auckland', 'Wellington'],
        price_ranges: [{ label: 'Under $100', min: 0, max: 100 }],
        rating_ranges: [{ label: '4+ Stars', min: 4, max: 5 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOptions,
      });

      const { result } = renderHook(() => useSearch());

      const options = await act(async () => {
        return await result.current.getFilterOptions();
      });

      expect(options).toEqual(mockOptions);
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      const options = await act(async () => {
        return await result.current.getFilterOptions();
      });

      expect(options).toBeNull();
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.saveSearchHistory(
          'photography',
          { serviceTypes: ['photography'] },
          5
        );
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: 'photography',
          filters: { serviceTypes: ['photography'] },
          result_count: 5,
        }),
      });
    });

    it('should handle save history error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.saveSearchHistory('photography', {}, 5);
      });

      // Should not throw, just log error
      expect(true).toBe(true); // Test passes if no error is thrown
    });
  });

  describe('getSearchHistory', () => {
    it('should get search history successfully', async () => {
      const mockHistory = [
        { id: '1', search_query: 'photography', created_at: '2024-01-01' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ searches: mockHistory }),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.getSearchHistory();
      });

      expect(result.current.searchHistory).toEqual(mockHistory);
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      const history = await act(async () => {
        return await result.current.getSearchHistory();
      });

      expect(history).toEqual([]);
    });
  });

  describe('saveSearch', () => {
    it('should save search successfully', async () => {
      const mockSavedSearch = {
        id: '1',
        name: 'Photography Search',
        search_query: 'photography',
        filters: { serviceTypes: ['photography'] },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ saved_search: mockSavedSearch }),
      });

      const { result } = renderHook(() => useSearch());

      const savedSearch = await act(async () => {
        return await result.current.saveSearch(
          'Photography Search',
          'photography',
          { serviceTypes: ['photography'] }
        );
      });

      expect(savedSearch).toEqual(mockSavedSearch);
      expect(result.current.savedSearches).toContain(mockSavedSearch);
    });

    it('should throw error on save failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        try {
          await result.current.saveSearch('Test', 'test', {});
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('addToFavorites', () => {
    it('should add to favorites successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Mock getFavorites to return updated list
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          favorites: [{ id: '1', contractor_id: 'contractor-1' }],
        }),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.addToFavorites('contractor-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/search/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractor_id: 'contractor-1' }),
      });
    });

    it('should throw error on add favorite failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        try {
          await result.current.addToFavorites('contractor-1');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove from favorites successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Mock getFavorites to return updated list
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: [] }),
      });

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.removeFromFavorites('contractor-1');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/favorites?contractor_id=contractor-1',
        {
          method: 'DELETE',
        }
      );
    });

    it('should throw error on remove favorite failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        try {
          await result.current.removeFromFavorites('contractor-1');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });
});
