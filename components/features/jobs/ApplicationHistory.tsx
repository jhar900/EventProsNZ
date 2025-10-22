'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationHistoryProps {
  contractorId: string;
  onApplicationSelect?: (application: JobApplicationWithDetails) => void;
  className?: string;
}

export function ApplicationHistory({
  contractorId,
  onApplicationSelect,
  className = '',
}: ApplicationHistoryProps) {
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  // Load applications on mount and when filters change
  useEffect(() => {
    loadApplications();
  }, [contractorId, searchQuery, statusFilter, currentPage]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `/api/contractors/${contractorId}/applications?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to load applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      setTotalPages(data.total_pages || 1);
      setTotalApplications(data.total || 0);
    } catch (error) {
      console.error('Error loading applications:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load applications'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'reviewed':
        return <EyeIcon className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter(application => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      application.job?.title?.toLowerCase().includes(query) ||
      application.cover_letter?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Application History
          </h2>
          <p className="text-gray-600 mt-1">
            {totalApplications}{' '}
            {totalApplications === 1 ? 'application' : 'applications'} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job title or cover letter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading applications...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading applications</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadApplications} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Applications List */}
      {!isLoading && !error && (
        <>
          {filteredApplications.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <DocumentIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No applications found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter
                    ? 'Try adjusting your search criteria'
                    : "You haven't submitted any applications yet"}
                </p>
                {(searchQuery || statusFilter) && (
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(application => (
                <Card
                  key={application.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onApplicationSelect?.(application)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.job?.title || 'Unknown Job'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(application.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(application.status)}
                              <span>
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </span>
                            </div>
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(application.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    {/* Cover Letter Preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Cover Letter:
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {application.cover_letter}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      {application.proposed_budget && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span>
                            Proposed: $
                            {application.proposed_budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {application.availability_start_date && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            Available:{' '}
                            {new Date(
                              application.availability_start_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {application.attachments &&
                        application.attachments.length > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <DocumentIcon className="h-4 w-4" />
                            <span>
                              {application.attachments.length} attachment(s)
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Job Status Warning */}
                    {application.job?.status !== 'active' && (
                      <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span>This job is no longer active</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
