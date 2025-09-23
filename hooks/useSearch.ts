'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SearchFilters {
  serviceTypes?: string[];
  location?: string;
  radius?: number;
  regions?: string[];
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  responseTime?: string;
  hasPortfolio?: boolean;
}

export interface SearchResult {
  contractors: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchQuery: any;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  suggestions: string[];
  searchHistory: any[];
  savedSearches: any[];
  favorites: any[];
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    query: '',
    filters: {},
    sortBy: 'relevance',
    results: null,
    isLoading: false,
    error: null,
    suggestions: [],
    searchHistory: [],
    savedSearches: [],
    favorites: [],
  });

  // Search contractors
  const searchContractors = useCallback(
    async (
      query: string = state.query,
      filters: SearchFilters = state.filters,
      sortBy: string = state.sortBy,
      page: number = 1,
      limit: number = 12
    ) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const searchParams = new URLSearchParams();

        if (query) searchParams.set('q', query);
        if (filters.serviceTypes?.length)
          searchParams.set('service_types', filters.serviceTypes.join(','));
        if (filters.location) searchParams.set('location', filters.location);
        if (filters.radius)
          searchParams.set('radius', filters.radius.toString());
        if (filters.regions?.length)
          searchParams.set('regions', filters.regions.join(','));
        if (filters.priceMin !== undefined)
          searchParams.set('price_min', filters.priceMin.toString());
        if (filters.priceMax !== undefined)
          searchParams.set('price_max', filters.priceMax.toString());
        if (filters.ratingMin !== undefined)
          searchParams.set('rating_min', filters.ratingMin.toString());
        if (filters.responseTime)
          searchParams.set('response_time', filters.responseTime);
        if (filters.hasPortfolio !== undefined)
          searchParams.set('has_portfolio', filters.hasPortfolio.toString());

        searchParams.set('sort', sortBy);
        searchParams.set('page', page.toString());
        searchParams.set('limit', limit.toString());

        const response = await fetch(`/api/contractors/search?${searchParams}`);

        if (!response.ok) {
          throw new Error('Failed to search contractors');
        }

        const results = await response.json();

        setState(prev => ({
          ...prev,
          results,
          isLoading: false,
          query,
          filters,
          sortBy,
        }));

        // Save search to history if user is authenticated and has meaningful search
        if (query || Object.keys(filters).length > 0) {
          await saveSearchHistory(query, filters, results.total);
        }

        return results;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw error;
      }
    },
    [state.query, state.filters, state.sortBy]
  );

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    try {
      const response = await fetch(
        `/api/contractors/suggestions?q=${encodeURIComponent(query)}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, suggestions: data.suggestions }));
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, []);

  // Get filter options
  const getFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/contractors/filters');

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Failed to get filter options:', error);
    }
    return null;
  }, []);

  // Save search to history
  const saveSearchHistory = useCallback(
    async (query: string, filters: SearchFilters, resultCount: number) => {
      try {
        await fetch('/api/search/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            search_query: query,
            filters,
            result_count: resultCount,
          }),
        });
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
    },
    []
  );

  // Get search history
  const getSearchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/search/history');

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, searchHistory: data.searches }));
        return data.searches;
      }
    } catch (error) {
      console.error('Failed to get search history:', error);
    }
    return [];
  }, []);

  // Save search
  const saveSearch = useCallback(
    async (name: string, query: string, filters: SearchFilters) => {
      try {
        const response = await fetch('/api/search/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            search_query: query,
            filters,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setState(prev => ({
            ...prev,
            savedSearches: [...prev.savedSearches, data.saved_search],
          }));
          return data.saved_search;
        }
      } catch (error) {
        console.error('Failed to save search:', error);
        throw error;
      }
    },
    []
  );

  // Get saved searches
  const getSavedSearches = useCallback(async () => {
    try {
      const response = await fetch('/api/search/saved');

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, savedSearches: data.saved_searches }));
        return data.saved_searches;
      }
    } catch (error) {
      console.error('Failed to get saved searches:', error);
    }
    return [];
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      const response = await fetch(`/api/search/saved?id=${searchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          savedSearches: prev.savedSearches.filter(
            search => search.id !== searchId
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      throw error;
    }
  }, []);

  // Add to favorites
  const addToFavorites = useCallback(async (contractorId: string) => {
    try {
      const response = await fetch('/api/search/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractor_id: contractorId }),
      });

      if (response.ok) {
        // Refresh favorites list
        await getFavorites();
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }, []);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (contractorId: string) => {
    try {
      const response = await fetch(
        `/api/search/favorites?contractor_id=${contractorId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // Refresh favorites list
        await getFavorites();
      }
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }, []);

  // Get favorites
  const getFavorites = useCallback(async () => {
    try {
      const response = await fetch('/api/search/favorites');

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, favorites: data.favorites }));
        return data.favorites;
      }
    } catch (error) {
      console.error('Failed to get favorites:', error);
    }
    return [];
  }, []);

  // Update query
  const updateQuery = useCallback(
    (query: string) => {
      setState(prev => ({ ...prev, query }));
      if (query.length >= 2) {
        getSuggestions(query);
      }
    },
    [getSuggestions]
  );

  // Update filters
  const updateFilters = useCallback((filters: SearchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  // Update sort
  const updateSort = useCallback((sortBy: string) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      filters: {},
      results: null,
      suggestions: [],
      error: null,
    }));
  }, []);

  return {
    ...state,
    searchContractors,
    getSuggestions,
    getFilterOptions,
    saveSearchHistory,
    getSearchHistory,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    updateQuery,
    updateFilters,
    updateSort,
    clearSearch,
  };
}
