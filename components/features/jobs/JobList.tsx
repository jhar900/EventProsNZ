'use client';

import { useState, useEffect } from 'react';
import { JobCard } from './JobCard';
import { JobFilters } from './JobFilters';
import { PaginationControls } from '../contractors/PaginationControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  Job,
  JobSearchParams,
  JobFilters as JobFiltersType,
} from '@/types/jobs';
import { useAuth } from '@/hooks/useAuth';

interface JobListProps {
  initialJobs?: Job[];
  initialFilters?: JobFiltersType;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
  onJobSelect?: (job: Job) => void;
  onJobApply?: (job: Job) => void;
  onJobEdit?: (job: Job) => void;
  onJobViewApplications?: (job: Job) => void;
  blurContactInfo?: boolean;
}

export function JobList({
  initialJobs = [],
  initialFilters = {},
  showFilters = true,
  showSearch = true,
  className = '',
  onJobSelect,
  onJobApply,
  onJobEdit,
  onJobViewApplications,
  blurContactInfo,
}: JobListProps) {
  const { user } = useAuth();

  // If blurContactInfo is not explicitly set, default to blurring for non-logged-in users
  const shouldBlur = blurContactInfo !== undefined ? blurContactInfo : !user;
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(initialJobs.length === 0); // Only show loading if no initial jobs
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFiltersType>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load jobs on mount and when filters change
  useEffect(() => {
    loadJobs();
  }, [filters, searchQuery, currentPage]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams: JobSearchParams = {
        ...filters,
        q: searchQuery,
        page: currentPage,
        limit: 12,
      };

      // Build query string from search params
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || 'Failed to load jobs'
        );
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalPages(data.total_pages || 1);
      setTotalJobs(data.total || 0);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const hasActiveFilters =
    Object.values(filters).some(
      value => value !== undefined && value !== null && value !== ''
    ) || searchQuery !== '';

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach(value => {
      if (value !== undefined && value !== null && value !== '') {
        count++;
      }
    });
    if (searchQuery) count++;
    return count;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Available Jobs</h2>
          <p className="text-gray-600 mt-1">
            {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-1"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showSearch && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <JobFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                onClear={handleClearFilters}
              />
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <MagnifyingGlassIcon className="h-3 w-3" />
                      <span>{searchQuery}</span>
                    </Badge>
                  )}
                  {filters.service_category && (
                    <Badge variant="secondary">
                      Service: {filters.service_category}
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary">
                      Location: {filters.location}
                    </Badge>
                  )}
                  {filters.budget_min && (
                    <Badge variant="secondary">
                      Min: ${filters.budget_min}
                    </Badge>
                  )}
                  {filters.budget_max && (
                    <Badge variant="secondary">
                      Max: ${filters.budget_max}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading jobs...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading jobs</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadJobs} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Jobs Grid */}
      {!isLoading && !error && (
        <>
          {jobs.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your search criteria'
                    : 'No jobs are currently available'}
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={() => onJobSelect?.(job)}
                  onApply={() => onJobApply?.(job)}
                  onEdit={() => onJobEdit?.(job)}
                  onViewApplications={() => onJobViewApplications?.(job)}
                  blurContactInfo={shouldBlur}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
