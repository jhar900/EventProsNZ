'use client';

import { useState, useEffect } from 'react';
import { useContractors } from '@/hooks/useContractors';
import { ContractorFilters, ViewMode } from '@/types/contractors';
import { ContractorGrid } from './ContractorGrid';
import { ContractorList } from './ContractorList';
import { ViewToggle } from './ViewToggle';
import { PaginationControls } from './PaginationControls';
import { ContractorFilters as ContractorFiltersComponent } from './ContractorFilters';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorBoundary from '@/components/ui/error-boundary';

interface ContractorDirectoryProps {
  initialFilters?: ContractorFilters;
  showFilters?: boolean;
  showFeatured?: boolean;
  className?: string;
}

export function ContractorDirectory({
  initialFilters = {},
  showFilters = true,
  showFeatured = true,
  className = '',
}: ContractorDirectoryProps) {
  const {
    contractors,
    featuredContractors,
    filters,
    pagination,
    viewMode,
    isLoading,
    error,
    fetchContractors,
    searchContractors,
    setViewMode,
    updateFilters,
    loadMore,
    clearError,
  } = useContractors();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load contractors on mount
  useEffect(() => {
    fetchContractors(initialFilters);
  }, [fetchContractors, initialFilters]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);

    const searchFilters = {
      ...filters,
      q: query || undefined,
    };

    if (query.trim()) {
      await searchContractors(searchFilters);
    } else {
      await fetchContractors(searchFilters);
    }

    setIsSearching(false);
  };

  const handleFilterChange = async (newFilters: Partial<ContractorFilters>) => {
    updateFilters(newFilters);

    const updatedFilters = { ...filters, ...newFilters };

    if (searchQuery.trim()) {
      await searchContractors(updatedFilters);
    } else {
      await fetchContractors(updatedFilters);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleLoadMore = async () => {
    if (searchQuery.trim()) {
      await searchContractors({}, pagination.page + 1);
    } else {
      await loadMore();
    }
  };

  const handlePageChange = async (page: number) => {
    if (searchQuery.trim()) {
      await searchContractors({}, page);
    } else {
      await fetchContractors({}, page);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Contractors
          </h3>
          <p className="mb-4">{error}</p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`contractor-directory ${className}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Contractor
          </h1>
          <p className="text-gray-600">
            Discover verified contractors for your next event
          </p>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="mb-6">
            <ContractorFiltersComponent
              filters={filters}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              isLoading={isLoading || isSearching}
            />
          </div>
        )}

        {/* Featured Contractors */}
        {showFeatured && featuredContractors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Featured Contractors
            </h2>
            <ContractorGrid
              contractors={featuredContractors}
              viewMode="grid"
              isFeatured={true}
              className="mb-6"
            />
          </div>
        )}

        {/* View Toggle and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <ViewToggle
              currentView={viewMode}
              onViewChange={handleViewModeChange}
            />
            <div className="text-sm text-gray-600">
              {pagination.total > 0 ? (
                <>
                  Showing {contractors.length} of {pagination.total} contractors
                </>
              ) : (
                'No contractors found'
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && contractors.length === 0 && (
          <div
            className="flex justify-center py-12"
            role="status"
            aria-label="Loading contractors"
          >
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Contractors List */}
        {contractors.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <ContractorGrid
                contractors={contractors}
                viewMode={viewMode}
                onLoadMore={handleLoadMore}
                hasMore={pagination.page < pagination.totalPages}
                isLoading={isLoading}
              />
            ) : (
              <ContractorList
                contractors={contractors}
                viewMode={viewMode}
                onLoadMore={handleLoadMore}
                hasMore={pagination.page < pagination.totalPages}
                isLoading={isLoading}
              />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <PaginationControls
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && contractors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <h3 className="text-lg font-semibold mb-2">
                No contractors found
              </h3>
              <p className="mb-4">
                Try adjusting your search criteria or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  updateFilters({});
                  fetchContractors();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
