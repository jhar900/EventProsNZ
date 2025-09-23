'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { SearchBar } from '@/components/features/search/SearchBar';
import { FilterPanel } from '@/components/features/search/FilterPanel';
import { SortControls } from '@/components/features/search/SortControls';
import { ContractorGrid } from '@/components/features/contractors/ContractorGrid';
import { PaginationControls } from '@/components/features/contractors/PaginationControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function SearchPage() {
  const {
    query,
    filters,
    sortBy,
    results,
    isLoading,
    error,
    suggestions,
    searchContractors,
    getSuggestions,
    getFilterOptions,
    updateQuery,
    updateFilters,
    updateSort,
    clearSearch,
  } = useSearch();

  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await getFilterOptions();
      setFilterOptions(options);
    };
    loadFilterOptions();
  }, [getFilterOptions]);

  // Perform search when query, filters, or sort changes
  useEffect(() => {
    const performSearch = async () => {
      if (query || Object.keys(filters).length > 0) {
        await searchContractors(query, filters, sortBy, currentPage);
      }
    };
    performSearch();
  }, [query, filters, sortBy, currentPage, searchContractors]);

  const handleSearch = async (searchQuery: string) => {
    setCurrentPage(1);
    await searchContractors(searchQuery, filters, sortBy, 1);
  };

  const handleFiltersChange = async (newFilters: any) => {
    setCurrentPage(1);
    updateFilters(newFilters);
  };

  const handleSortChange = async (newSortBy: string) => {
    setCurrentPage(1);
    updateSort(newSortBy);
    await searchContractors(query, filters, newSortBy, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearSearch = () => {
    clearSearch();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Contractors
          </h1>
          <p className="text-gray-600">
            Search and filter through our verified contractors to find the
            perfect match for your event.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <SearchBar
              value={query}
              onChange={updateQuery}
              onSearch={handleSearch}
              suggestions={suggestions}
              isLoading={isLoading}
              placeholder="Search contractors, services, or locations..."
            />

            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
              isLoading={isLoading}
            />

            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <SortControls
                sortBy={sortBy}
                onSortChange={handleSortChange}
                isLoading={isLoading}
              />

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>Advanced</span>
                </Button>

                {(query || Object.keys(filters).length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          {results && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {results.total} contractor{results.total !== 1 ? 's' : ''}{' '}
                  found
                </h2>
                {query && (
                  <span className="text-sm text-gray-500">
                    for &ldquo;{query}&rdquo;
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>
                  Page {results.page} of {results.totalPages}
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 text-center">
              <div className="text-red-600 mb-2">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Search Error</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button
                onClick={() =>
                  searchContractors(query, filters, sortBy, currentPage)
                }
              >
                Try Again
              </Button>
            </Card>
          )}

          {/* No Results */}
          {results && results.contractors.length === 0 && !isLoading && (
            <Card className="p-6 text-center">
              <div className="text-gray-500 mb-4">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No contractors found</h3>
                <p className="text-sm">
                  Try adjusting your search criteria or filters to find more
                  results.
                </p>
              </div>
              <Button onClick={handleClearSearch}>Clear search</Button>
            </Card>
          )}

          {/* Results Grid */}
          {results && results.contractors.length > 0 && (
            <>
              <ContractorGrid
                contractors={results.contractors}
                isLoading={isLoading}
              />

              {/* Pagination */}
              {results.totalPages > 1 && (
                <PaginationControls
                  currentPage={results.page}
                  totalPages={results.totalPages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              )}
            </>
          )}

          {/* Initial State */}
          {!results && !isLoading && !error && (
            <Card className="p-6 text-center">
              <div className="text-gray-500 mb-4">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Start your search</h3>
                <p className="text-sm">
                  Enter a search term or use the filters above to find
                  contractors.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
