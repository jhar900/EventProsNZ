'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JobCard } from '@/components/features/jobs/JobCard';
import { JobFilters } from '@/components/features/jobs/JobFilters';
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge';
import { JobWithDetails, JobSearchParams } from '@/types/jobs';
import { Search, Plus, Filter, Grid, List } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobSearchParams>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });

  // Fetch jobs
  const fetchJobs = async (searchParams: JobSearchParams = filters) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.jobs || []);
      setPagination({
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 20,
        total_pages: result.total_pages || 0,
      });
    } catch (error) {
      console.error('Fetch jobs error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      q: searchQuery,
      page: 1,
    };
    setFilters(newFilters);
    fetchJobs(newFilters);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: JobSearchParams) => {
    setFilters(newFilters);
  };

  // Handle filter search
  const handleFilterSearch = () => {
    fetchJobs(filters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    fetchJobs(clearedFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchJobs(newFilters);
  };

  // Handle job view
  const handleViewJob = (jobId: string) => {
    // Navigate to job details page
    window.location.href = `/jobs/${jobId}`;
  };

  // Handle job application
  const handleApplyJob = (jobId: string) => {
    // Navigate to job application page
    window.location.href = `/jobs/${jobId}/apply`;
  };

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
            <p className="text-gray-600 mt-2">
              Find the perfect event management opportunities
            </p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Post a Job
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs by title, description, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Showing {jobs.length} of {pagination.total} jobs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {pagination.page} of {pagination.total_pages} pages
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <JobFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={handleFilterSearch}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Jobs List */}
        <div className={showFilters ? 'lg:col-span-3' : 'col-span-full'}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchJobs()}>Try Again</Button>
                </div>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No jobs found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={handleViewJob}
                  onApply={handleApplyJob}
                  showActions={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && jobs.length > 0 && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from(
                  { length: Math.min(5, pagination.total_pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={
                          pagination.page === page ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
