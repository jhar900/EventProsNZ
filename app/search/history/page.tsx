'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SearchHistoryPage() {
  const { searchHistory, isLoading, getSearchHistory } = useSearch();

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    getSearchHistory();
  }, [getSearchHistory]);

  const handleSearchAgain = (search: any) => {
    // Navigate to search page with the search parameters
    const params = new URLSearchParams();
    if (search.search_query) params.set('q', search.search_query);
    if (search.filters) {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    window.location.href = `/contractors/search?${params.toString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168)
      return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getFilterSummary = (filters: any) => {
    const parts = [];
    if (filters.serviceTypes?.length)
      parts.push(
        `${filters.serviceTypes.length} service type${filters.serviceTypes.length !== 1 ? 's' : ''}`
      );
    if (filters.location) parts.push(`Location: ${filters.location}`);
    if (filters.regions?.length)
      parts.push(
        `${filters.regions.length} region${filters.regions.length !== 1 ? 's' : ''}`
      );
    if (filters.priceMin !== undefined || filters.priceMax !== undefined)
      parts.push('Price range');
    if (filters.ratingMin !== undefined)
      parts.push(`${filters.ratingMin}+ stars`);
    if (filters.responseTime) parts.push(`Response: ${filters.responseTime}`);
    if (filters.hasPortfolio !== undefined)
      parts.push(`Portfolio: ${filters.hasPortfolio ? 'Yes' : 'No'}`);

    return parts.length > 0 ? parts.join(', ') : 'No filters';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/contractors">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to contractors</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Search History
              </h1>
              <p className="text-gray-600">Your recent searches and results</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">
              Loading search history...
            </span>
          </div>
        )}

        {/* No History */}
        {!isLoading && searchHistory.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No search history</h3>
              <p className="text-sm">
                Your search history will appear here once you start searching
                for contractors.
              </p>
            </div>
            <Link href="/contractors/search">
              <Button>Start Searching</Button>
            </Link>
          </Card>
        )}

        {/* Search History List */}
        {!isLoading && searchHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {searchHistory.length} recent search
                {searchHistory.length !== 1 ? 'es' : ''}
              </h2>
            </div>

            <div className="space-y-3">
              {searchHistory.map(search => (
                <Card key={search.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {search.search_query || 'No search query'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Filters: {getFilterSummary(search.filters)}</div>
                        <div>
                          Results: {search.result_count} contractor
                          {search.result_count !== 1 ? 's' : ''}
                        </div>
                        <div>Date: {formatDate(search.created_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchAgain(search)}
                        className="text-xs"
                      >
                        Search Again
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
