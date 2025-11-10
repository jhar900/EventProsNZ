'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Filter,
  Search,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Eye,
  MessageCircle,
  Tag,
  User as UserIcon,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import FeatureRequestSearch from '@/components/features/feature-requests/FeatureRequestSearch';
import FeatureRequestCard from '@/components/features/feature-requests/FeatureRequestCard';
import FeatureRequestForm from '@/components/features/feature-requests/FeatureRequestForm';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status:
    | 'submitted'
    | 'under_review'
    | 'planned'
    | 'in_development'
    | 'completed'
    | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vote_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  feature_request_categories?: {
    name: string;
    color: string;
  };
  feature_request_tag_assignments?: Array<{
    feature_request_tags: {
      name: string;
    };
  }>;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  comments_count?: number;
  is_public?: boolean;
}

interface SearchFilters {
  search: string;
  status: string;
  category_id: string;
  sort: 'newest' | 'oldest' | 'most_voted' | 'least_voted';
  user_id?: string;
}

export default function FeatureRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingRef, setIsSubmittingRef] = useState(false); // Ref-like state to prevent navigation
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    category_id: '',
    sort: 'newest',
  });

  // Load feature requests
  const loadFeatureRequests = useCallback(
    async (page = 1, searchFilters = filters) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          ...searchFilters,
        });

        // Include user ID in header as fallback if cookies don't work
        const headers: HeadersInit = {};
        if (user?.id) {
          headers['X-User-Id'] = user.id;
        }

        const response = await fetch(`/api/feature-requests?${params}`, {
          credentials: 'include', // Ensure cookies are sent
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setFeatureRequests(data.featureRequests || []);
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        } else {
          if (response.status === 401) {
            // User not authenticated - this is okay for viewing public requests
            // Don't redirect, just show empty list or error
            console.warn('Not authenticated to view feature requests');
            setFeatureRequests([]);
            setTotalCount(0);
          } else {
            toast.error('Failed to load feature requests');
          }
        }
      } catch (error) {
        console.error('Error loading feature requests:', error);
        toast.error('Failed to load feature requests');
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  // Load feature requests on mount and when filters change
  useEffect(() => {
    loadFeatureRequests(1, filters);
  }, [filters, loadFeatureRequests]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadFeatureRequests(page, filters);
  };

  const loadComments = async (featureRequestId: string) => {
    setIsLoadingComments(true);
    try {
      const headers: HeadersInit = {};
      if (user?.id) {
        headers['X-User-Id'] = user.id;
      }

      const response = await fetch(
        `/api/feature-requests/${featureRequestId}/comments`,
        {
          credentials: 'include',
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedComments = data.comments || [];
        setComments(loadedComments);

        // Update the comment count in the feature requests list
        setFeatureRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === featureRequestId
              ? { ...req, comments_count: loadedComments.length }
              : req
          )
        );

        // Also update the selected request if it's the same one
        if (selectedRequest && selectedRequest.id === featureRequestId) {
          setSelectedRequest({
            ...selectedRequest,
            comments_count: loadedComments.length,
          });
        }
      } else {
        console.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedRequest || !newComment.trim() || !user) {
      if (!user) {
        toast.error('Please log in to add a comment');
        router.push('/login');
      }
      return;
    }

    setIsSubmittingComment(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user.id) {
        headers['X-User-Id'] = user.id;
      }

      const response = await fetch(
        `/api/feature-requests/${selectedRequest.id}/comments`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');

        // Update the comment count in the feature requests list
        setFeatureRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === selectedRequest.id
              ? { ...req, comments_count: (req.comments_count || 0) + 1 }
              : req
          )
        );

        // Also update the selected request
        if (selectedRequest) {
          setSelectedRequest({
            ...selectedRequest,
            comments_count: (selectedRequest.comments_count || 0) + 1,
          });
        }

        toast.success('Comment added successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleVote = async (
    featureRequestId: string,
    voteType: 'upvote' | 'downvote'
  ) => {
    try {
      const response = await fetch(
        `/api/feature-requests/${featureRequestId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote_type: voteType }),
        }
      );

      if (response.ok) {
        // Reload the current page to get updated vote counts
        loadFeatureRequests(currentPage, filters);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  const handleSaveDraft = async (data: {
    title: string;
    description: string;
    category_id: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    is_public: boolean;
  }) => {
    try {
      // Save to localStorage as draft
      const drafts = JSON.parse(
        localStorage.getItem('feature_request_drafts') || '[]'
      );
      const draft = {
        ...data,
        id: Date.now().toString(),
        saved_at: new Date().toISOString(),
      };
      drafts.push(draft);
      localStorage.setItem('feature_request_drafts', JSON.stringify(drafts));
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleSubmitRequest = async (data: {
    title: string;
    description: string;
    category_id: string;
    tags: string[];
    is_public: boolean;
  }) => {
    if (!user) {
      toast.error('Please log in to submit a feature request');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setIsSubmittingRef(true);

    try {
      console.log('Starting feature request submission...');

      // User is already checked above, so we can proceed
      // The API will authenticate via cookies, but also send user_id as fallback
      console.log('Submitting request (user authenticated via cookies)...');
      console.log('User ID:', user?.id);

      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id, // Send user ID as header fallback
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          ...data,
          user_id: user.id, // Also include in body as fallback
        }),
      });

      console.log('Response received:', response.status, response.ok);

      if (response.ok) {
        const featureRequest = await response.json();
        console.log('Feature request submitted successfully:', featureRequest);
        toast.success(
          'Thank you for your submission! The Event Pros team will review your feature request as soon as possible.',
          {
            duration: 5000, // Show for 5 seconds
          }
        );

        // DON'T close modal immediately - wait a bit to prevent re-render issues
        // Prevent any navigation - use a flag to prevent redirects
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);

        // Small delay before closing modal and reloading
        setTimeout(() => {
          // Close modal after a delay
          setIsModalOpen(false);

          // Check if we're still on the same page before reloading
          if (window.location.pathname === currentPath) {
            console.log('Still on feature requests page, reloading list...');
            loadFeatureRequests(1, filters).catch(err => {
              console.error('Error reloading:', err);
            });
          } else {
            console.log(
              'Path changed to:',
              window.location.pathname,
              '- not reloading'
            );
          }
        }, 500);
      } else {
        const error = await response.json();
        console.error('Feature request submission error:', error);
        // Show detailed error message if available
        if (error.details) {
          const details = Array.isArray(error.details)
            ? error.details
                .map((d: any) => `${d.path.join('.')}: ${d.message}`)
                .join(', ')
            : JSON.stringify(error.details);
          toast.error(
            `${error.error || 'Failed to submit feature request'}: ${details}`
          );
        } else {
          toast.error(error.error || 'Failed to submit feature request');
        }
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast.error('Failed to submit feature request');
    } finally {
      setIsSubmitting(false);
      setIsSubmittingRef(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      submitted: 0,
      under_review: 0,
      planned: 0,
      in_development: 0,
      completed: 0,
      rejected: 0,
    };

    featureRequests.forEach(request => {
      counts[request.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Feature Requests</h1>
              <p className="text-gray-600 mt-2">
                Submit and vote on feature requests to help shape the
                platform&apos;s development
              </p>
            </div>

            <Button
              onClick={() => {
                if (!user) {
                  toast.error('Please log in to submit a feature request');
                  router.push('/login');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
              disabled={authLoading}
            >
              <Plus className="w-4 h-4" />
              Submit Request
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{totalCount}</p>
                    <p className="text-sm text-gray-600">Total Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {statusCounts.under_review}
                    </p>
                    <p className="text-sm text-gray-600">Under Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {statusCounts.in_development}
                    </p>
                    <p className="text-sm text-gray-600">In Development</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {statusCounts.completed}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <FeatureRequestSearch
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                      <div className="h-3 bg-gray-200 rounded w-3/5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featureRequests.length > 0 ? (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {featureRequests.length} of {totalCount} feature
                  requests
                </p>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Page {currentPage} of {totalPages}
                  </Badge>
                </div>
              </div>

              {/* Feature Requests Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featureRequests.map(request => (
                  <FeatureRequestCard
                    key={request.id}
                    id={request.id}
                    title={request.title}
                    description={request.description}
                    status={request.status}
                    priority={request.priority}
                    vote_count={request.vote_count}
                    view_count={request.view_count}
                    created_at={request.created_at}
                    updated_at={request.updated_at}
                    category={request.feature_request_categories}
                    tags={request.feature_request_tag_assignments?.map(
                      assignment => ({
                        name: assignment.feature_request_tags.name,
                      })
                    )}
                    author={request.profiles}
                    is_featured={request.is_featured}
                    is_public={request.is_public}
                    comments_count={request.comments_count || 0}
                    onVote={handleVote}
                    onClick={async () => {
                      setSelectedRequest(request);
                      setIsDetailModalOpen(true);
                      // Load comments when modal opens
                      if (request.id) {
                        await loadComments(request.id);
                      }
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No feature requests found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or submit a new feature
                  request.
                </p>
                <Button
                  onClick={() => {
                    if (!user) {
                      toast.error('Please log in to submit a feature request');
                      router.push('/login');
                      return;
                    }
                    setIsModalOpen(true);
                  }}
                  disabled={authLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Submit Request Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Feature Request</DialogTitle>
              <DialogDescription>
                Help us improve the platform by submitting your feature request.
                Please provide detailed information about what you would like to
                see implemented.
              </DialogDescription>
            </DialogHeader>
            {isModalOpen && (
              <FeatureRequestForm
                key={isModalOpen ? 'open' : 'closed'}
                onSave={handleSaveDraft}
                onSubmit={handleSubmitRequest}
                isLoading={isSubmitting}
                showCard={false}
                showCategory={false}
                showPriority={false}
                strictValidation={false}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Feature Request Detail Modal */}
        <Dialog
          open={isDetailModalOpen}
          onOpenChange={open => {
            setIsDetailModalOpen(open);
            if (!open) {
              // Reset comments when modal closes
              setComments([]);
              setNewComment('');
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl mb-2">
                        {selectedRequest.title}
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        {selectedRequest.description}
                      </DialogDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {selectedRequest.is_featured && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 border-yellow-200"
                        >
                          Featured
                        </Badge>
                      )}
                      <Badge
                        variant={
                          selectedRequest.is_public ? 'default' : 'secondary'
                        }
                        className={
                          selectedRequest.is_public
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {selectedRequest.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  {/* Status and Category */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      className={`flex items-center gap-1 ${
                        selectedRequest.status === 'submitted'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedRequest.status === 'under_review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedRequest.status === 'planned'
                              ? 'bg-purple-100 text-purple-800'
                              : selectedRequest.status === 'in_development'
                                ? 'bg-orange-100 text-orange-800'
                                : selectedRequest.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedRequest.status
                        .replace('_', ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>

                    {selectedRequest.feature_request_categories && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              selectedRequest.feature_request_categories.color,
                          }}
                        />
                        {selectedRequest.feature_request_categories.name}
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedRequest.feature_request_tag_assignments &&
                    selectedRequest.feature_request_tag_assignments.length >
                      0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.feature_request_tag_assignments.map(
                          (assignment, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {assignment.feature_request_tags.name}
                            </Badge>
                          )
                        )}
                      </div>
                    )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Votes</p>
                        <p className="text-lg font-bold">
                          {selectedRequest.vote_count || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Views</p>
                        <p className="text-lg font-bold">
                          {selectedRequest.view_count || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Comments</p>
                        <p className="text-lg font-bold">{comments.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Author and Date */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    {selectedRequest.profiles && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {selectedRequest.profiles.first_name}{' '}
                          {selectedRequest.profiles.last_name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(
                          selectedRequest.created_at
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Comments ({comments.length})
                    </h3>

                    {/* Comments List */}
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {isLoadingComments ? (
                        <div className="text-center text-gray-500 py-4">
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          No comments yet. Be the first to comment!
                        </div>
                      ) : (
                        comments.map((comment: any) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>
                                {comment.profiles?.first_name?.[0]}
                                {comment.profiles?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {comment.profiles?.first_name}{' '}
                                  {comment.profiles?.last_name}
                                </span>
                                {comment.is_admin_comment && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-purple-100 text-purple-800"
                                  >
                                    Admin
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    comment.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Form */}
                    {user ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || isSubmittingComment}
                            size="sm"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmittingComment
                              ? 'Posting...'
                              : 'Post Comment'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">
                          Please log in to add a comment
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/login')}
                        >
                          Log In
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
