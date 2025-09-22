'use client';

import { useState, useEffect } from 'react';
import { ContractorFilters as ContractorFiltersType } from '@/types/contractors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ContractorFiltersProps {
  filters: ContractorFiltersType;
  searchQuery: string;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Partial<ContractorFiltersType>) => void;
  isLoading?: boolean;
  className?: string;
}

const SERVICE_TYPES = [
  'catering',
  'photography',
  'videography',
  'music',
  'decorations',
  'venue',
  'planning',
  'security',
  'transportation',
  'flowers',
  'lighting',
  'other',
];

const LOCATIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Napier',
  'Dunedin',
  'Palmerston North',
  'Nelson',
  'Rotorua',
];

const RATING_OPTIONS = [
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];

export function ContractorFilters({
  filters,
  searchQuery,
  onSearch,
  onFilterChange,
  isLoading = false,
  className = '',
}: ContractorFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] =
    useState<ContractorFiltersType>(filters);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleFilterChange = (key: keyof ContractorFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ContractorFiltersType = {};
    setLocalFilters(clearedFilters);
    setLocalSearchQuery('');
    onSearch('');
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== null && value !== ''
  );

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(
      value => value !== undefined && value !== null && value !== ''
    ).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contractors, services, or locations..."
            value={localSearchQuery}
            onChange={e => setLocalSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {localSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalSearchQuery('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full sm:w-auto"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map(type => (
                <Button
                  key={type}
                  variant={
                    localFilters.serviceType === type ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      'serviceType',
                      localFilters.serviceType === type ? undefined : type
                    )
                  }
                  className="text-xs"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(location => (
                <Button
                  key={location}
                  variant={
                    localFilters.location === location ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      'location',
                      localFilters.location === location ? undefined : location
                    )
                  }
                  className="text-xs"
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  variant={
                    localFilters.ratingMin === option.value
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      'ratingMin',
                      localFilters.ratingMin === option.value
                        ? undefined
                        : option.value
                    )
                  }
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price ($)
              </label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.priceMin || ''}
                onChange={e =>
                  handleFilterChange(
                    'priceMin',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price ($)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={localFilters.priceMax || ''}
                onChange={e =>
                  handleFilterChange(
                    'priceMax',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="10"
              />
            </div>
          </div>

          {/* Premium Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="premiumOnly"
              checked={localFilters.premiumOnly || false}
              onChange={e =>
                handleFilterChange('premiumOnly', e.target.checked || undefined)
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="premiumOnly" className="ml-2 text-sm text-gray-700">
              Premium contractors only
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
