'use client';

import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceTypeFilter } from './ServiceTypeFilter';
import { LocationFilter } from './LocationFilter';
import { RegionFilter } from './RegionFilter';
import { BudgetFilter } from './BudgetFilter';
import { RatingFilter } from './RatingFilter';
import { ResponseTimeFilter } from './ResponseTimeFilter';
import { PortfolioFilter } from './PortfolioFilter';

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

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions?: {
    serviceTypes?: string[];
    regions?: string[];
    priceRanges?: Array<{ label: string; min: number; max: number | null }>;
    ratingRanges?: Array<{ label: string; min: number; max: number }>;
  };
  isLoading?: boolean;
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  filterOptions = {},
  isLoading = false,
  className = '',
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.serviceTypes?.length) count++;
    if (filters.location) count++;
    if (filters.regions?.length) count++;
    if (filters.priceMin !== undefined || filters.priceMax !== undefined)
      count++;
    if (filters.ratingMin !== undefined) count++;
    if (filters.responseTime) count++;
    if (filters.hasPortfolio !== undefined) count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
          disabled={isLoading}
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
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={isLoading}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.serviceTypes?.map(serviceType => (
            <Badge
              key={serviceType}
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <span>Service: {serviceType}</span>
              <button
                onClick={() => {
                  const newServiceTypes = filters.serviceTypes?.filter(
                    s => s !== serviceType
                  );
                  handleFilterChange(
                    'serviceTypes',
                    newServiceTypes?.length ? newServiceTypes : undefined
                  );
                }}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.location && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Location: {filters.location}</span>
              <button
                onClick={() => handleFilterChange('location', undefined)}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.regions?.map(region => (
            <Badge
              key={region}
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <span>Region: {region}</span>
              <button
                onClick={() => {
                  const newRegions = filters.regions?.filter(r => r !== region);
                  handleFilterChange(
                    'regions',
                    newRegions?.length ? newRegions : undefined
                  );
                }}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {(filters.priceMin !== undefined ||
            filters.priceMax !== undefined) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Price: ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
              </span>
              <button
                onClick={() => {
                  handleFilterChange('priceMin', undefined);
                  handleFilterChange('priceMax', undefined);
                }}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.ratingMin !== undefined && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Rating: {filters.ratingMin}+ stars</span>
              <button
                onClick={() => handleFilterChange('ratingMin', undefined)}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.responseTime && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Response: {filters.responseTime}</span>
              <button
                onClick={() => handleFilterChange('responseTime', undefined)}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.hasPortfolio !== undefined && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Portfolio: {filters.hasPortfolio ? 'Yes' : 'No'}</span>
              <button
                onClick={() => handleFilterChange('hasPortfolio', undefined)}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-6">
          <ServiceTypeFilter
            value={filters.serviceTypes || []}
            onChange={serviceTypes =>
              handleFilterChange('serviceTypes', serviceTypes)
            }
            options={filterOptions.serviceTypes || []}
            isLoading={isLoading}
          />

          <LocationFilter
            value={filters.location || ''}
            radius={filters.radius}
            onChange={(location, radius) => {
              handleFilterChange('location', location);
              handleFilterChange('radius', radius);
            }}
            isLoading={isLoading}
          />

          <RegionFilter
            value={filters.regions || []}
            onChange={regions => handleFilterChange('regions', regions)}
            options={filterOptions.regions || []}
            isLoading={isLoading}
          />

          <BudgetFilter
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onChange={(priceMin, priceMax) => {
              handleFilterChange('priceMin', priceMin);
              handleFilterChange('priceMax', priceMax);
            }}
            priceRanges={filterOptions.priceRanges || []}
            isLoading={isLoading}
          />

          <RatingFilter
            value={filters.ratingMin}
            onChange={ratingMin => handleFilterChange('ratingMin', ratingMin)}
            ratingRanges={filterOptions.ratingRanges || []}
            isLoading={isLoading}
          />

          <ResponseTimeFilter
            value={filters.responseTime || ''}
            onChange={responseTime =>
              handleFilterChange('responseTime', responseTime)
            }
            isLoading={isLoading}
          />

          <PortfolioFilter
            value={filters.hasPortfolio}
            onChange={hasPortfolio =>
              handleFilterChange('hasPortfolio', hasPortfolio)
            }
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
