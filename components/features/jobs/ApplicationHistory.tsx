'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const { user } = useAuth();
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

  // Edit/Delete state
  const [editingApplication, setEditingApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [deletingApplication, setDeletingApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editBudget, setEditBudget] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load applications on mount and when filters change
  useEffect(() => {
    if (user?.id) {
      loadApplications();
    }
  }, [contractorId, searchQuery, statusFilter, currentPage, user?.id]);

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

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/contractors/${contractorId}/applications?${params}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        // Don't throw error, just show empty state
        setApplications([]);
        setTotalPages(1);
        setTotalApplications(0);
        setError(null); // Clear any previous errors
        return;
      }

      const data = await response.json();

      // Handle both success: true and success: false cases
      if (data.success === false) {
        setApplications([]);
        setTotalPages(1);
        setTotalApplications(0);
        setError(null); // Clear any previous errors
        return;
      }

      setApplications(data.applications || []);
      setTotalPages(data.total_pages || 1);
      setTotalApplications(data.total || 0);
      setError(null); // Clear any errors on success
    } catch (error) {
      console.error('Error loading applications:', error);
      // Set empty state instead of error state
      setApplications([]);
      setTotalPages(1);
      setTotalApplications(0);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === 'all' ? '' : status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditClick = (
    e: React.MouseEvent,
    application: JobApplicationWithDetails
  ) => {
    e.stopPropagation();
    setEditingApplication(application);
    setEditMessage(application.application_message || '');
    setEditBudget(application.proposed_budget?.toString() || '');
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    application: JobApplicationWithDetails
  ) => {
    e.stopPropagation();
    setDeletingApplication(application);
  };

  const handleUpdateApplication = async () => {
    if (!editingApplication) return;

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/applications/${editingApplication.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            application_message: editMessage,
            proposed_budget: editBudget ? parseFloat(editBudget) : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update application');
      }

      // Update the local state
      setApplications(prev =>
        prev.map(app =>
          app.id === editingApplication.id
            ? {
                ...app,
                application_message: editMessage,
                proposed_budget: editBudget ? parseFloat(editBudget) : null,
              }
            : app
        )
      );

      setEditingApplication(null);
    } catch (error) {
      console.error('Error updating application:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update application'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!deletingApplication) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/applications/${deletingApplication.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete application');
      }

      // Remove from local state
      setApplications(prev =>
        prev.filter(app => app.id !== deletingApplication.id)
      );
      setTotalApplications(prev => prev - 1);
      setDeletingApplication(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to delete application'
      );
    } finally {
      setIsDeleting(false);
    }
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
      application.application_message?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Application History
          </h2>
          <p className="text-gray-600 mt-1">
            {totalApplications}{' '}
            {totalApplications === 1 ? 'application' : 'applications'} found
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter || undefined}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                        Application Message:
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {application.application_message}
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

                    {/* Actions */}
                    {application.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => handleEditClick(e, application)}
                          className="flex items-center space-x-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => handleDeleteClick(e, application)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
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

      {/* Edit Application Dialog */}
      <Dialog
        open={!!editingApplication}
        onOpenChange={open => !open && setEditingApplication(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update your application for{' '}
              {editingApplication?.job?.title || 'this job'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-message">Application Message</Label>
              <Textarea
                id="edit-message"
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
                placeholder="Enter your application message..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budget">Proposed Budget ($)</Label>
              <Input
                id="edit-budget"
                type="number"
                value={editBudget}
                onChange={e => setEditBudget(e.target.value)}
                placeholder="Enter your proposed budget"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingApplication(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateApplication}
              disabled={isUpdating || !editMessage.trim()}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingApplication}
        onOpenChange={open => !open && setDeletingApplication(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your application for &quot;
              {deletingApplication?.job?.title || 'this job'}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingApplication(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteApplication}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
