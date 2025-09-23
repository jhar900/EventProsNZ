/**
 * Map Search Component
 * Map-based search functionality
 */

'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMapStore } from '@/stores/map';

export const MapSearch: React.FC = () => {
  const { searchMap, clearSearch, searchResults } = useMapStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    try {
      await searchMap(searchQuery);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    clearSearch();
  };

  const handleResultClick = (result: any) => {
    // Handle result selection
    onResultSelect?.(result);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search contractors, locations..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Search Results ({searchResults.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm border border-gray-200"
              >
                <div className="font-medium text-gray-900">{result.name}</div>
                <div className="text-gray-500 capitalize">{result.type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Status */}
      {isSearching && (
        <div className="text-sm text-gray-500 text-center">Searching...</div>
      )}
    </div>
  );
};
