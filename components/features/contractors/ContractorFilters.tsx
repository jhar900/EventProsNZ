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
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);

  // Fetch service categories from API
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await fetch('/api/contractors/filters');
        if (response.ok) {
          const data = await response.json();
          setServiceTypes(data.service_types || []);
        }
      } catch (error) {
        console.error('Error fetching service types:', error);
        // Fallback to empty array if API fails
        setServiceTypes([]);
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, []);

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
    // Explicitly clear all filter properties
    const clearedFilters: ContractorFiltersType = {
      q: undefined,
      serviceType: undefined,
      location: undefined,
    };
    setLocalFilters(clearedFilters);
    setLocalSearchQuery('');
    onSearch('');
    // Pass empty object to completely replace filters
    onFilterChange({});
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
        <div className="flex gap-2 items-stretch">
          <div className="relative flex-1">
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
            className="px-6 py-3 h-auto"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
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
              {loadingServiceTypes ? (
                <div className="text-sm text-gray-500">
                  Loading categories...
                </div>
              ) : serviceTypes.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No service categories available
                </div>
              ) : (
                serviceTypes.map(type => (
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
                ))
              )}
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
        </div>
      )}
    </div>
  );
}
