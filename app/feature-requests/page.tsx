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
  DialogFooter,
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
  MessageCircle,
  Tag,
  User as UserIcon,
  Send,
  Trash2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import FeatureRequestSearch from '@/components/features/feature-requests/FeatureRequestSearch';
import FeatureRequestCard from '@/components/features/feature-requests/FeatureRequestCard';
import FeatureRequestForm from '@/components/features/feature-requests/FeatureRequestForm';
import FeatureRequestBoard from '@/components/features/feature-requests/FeatureRequestBoard';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface FeatureRequest {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  status: 'submitted' | 'planned' | 'in_development' | 'completed' | 'rejected';
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
  users?: {
    role: string;
  };
  comments_count?: number;
  is_public?: boolean;
  attachment_url?: string | null;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [attachmentImageUrl, setAttachmentImageUrl] = useState<string | null>(
    null
  );
  const [isLoadingAttachment, setIsLoadingAttachment] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    category_id: '',
    sort: 'newest',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');

  // Load feature requests
  const loadFeatureRequests = useCallback(
    async (page = 1, searchFilters = filters, currentViewMode = viewMode) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          // Load more items for board view, or use pagination for grid view
          limit:
            user?.role === 'admin' && currentViewMode === 'board'
              ? '100'
              : '12',
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
    [filters, user?.role, viewMode]
  );

  // Load feature requests on mount and when filters or view mode change
  useEffect(() => {
    loadFeatureRequests(1, filters, viewMode);
  }, [filters, loadFeatureRequests, viewMode]);

  // Load attachment image when modal opens
  useEffect(() => {
    const loadAttachmentImage = async () => {
      if (!isDetailModalOpen || !selectedRequest?.attachment_url || !user?.id) {
        setAttachmentImageUrl(null);
        return;
      }

      const fileName = selectedRequest.attachment_url.split('/').pop() || '';
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

      if (!isImage) {
        setAttachmentImageUrl(null);
        return;
      }

      setIsLoadingAttachment(true);
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        headers['x-user-id'] = user.id;

        const response = await fetch(
          `/api/feature-requests/${selectedRequest.id}/attachment`,
          {
            credentials: 'include',
            headers,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAttachmentImageUrl(data.url);
        } else {
          setAttachmentImageUrl(null);
        }
      } catch (error) {
        console.error('Error loading attachment image:', error);
        setAttachmentImageUrl(null);
      } finally {
        setIsLoadingAttachment(false);
      }
    };

    loadAttachmentImage();
  }, [
    isDetailModalOpen,
    selectedRequest?.id,
    selectedRequest?.attachment_url,
    user?.id,
  ]);

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

  const isOwner =
    user && selectedRequest && user.id === selectedRequest.user_id;

  const handleDelete = async () => {
    if (!selectedRequest) return;

    setIsDeleting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['X-User-Id'] = user.id;
      }

      const response = await fetch(
        `/api/feature-requests/${selectedRequest.id}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Feature request deleted successfully');
        // Remove from list
        setFeatureRequests(prevRequests =>
          prevRequests.filter(req => req.id !== selectedRequest.id)
        );
        // Close modals
        setIsDetailModalOpen(false);
        setShowDeleteDialog(false);
        setSelectedRequest(null);
        // Update total count
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete feature request');
      }
    } catch (error) {
      console.error('Error deleting feature request:', error);
      toast.error('Failed to delete feature request');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVote = async (featureRequestId: string, voteType: 'upvote') => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Include user ID in header as fallback if cookies fail
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/feature-requests/${featureRequestId}/vote`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ vote_type: voteType }),
        }
      );

      if (response.ok) {
        // Fetch updated vote count for just this request without reloading all
        // This keeps the cards visible and just updates the numbers
        const voteResponse = await fetch(
          `/api/feature-requests/${featureRequestId}/vote`,
          { credentials: 'include' }
        );
        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          const newTotal =
            voteData.vote_counts.upvotes - voteData.vote_counts.downvotes;

          // Update just this request's vote count without reloading the entire list
          setFeatureRequests(prev =>
            prev.map(request =>
              request.id === featureRequestId
                ? { ...request, vote_count: newTotal }
                : request
            )
          );
        } else {
          console.error('Failed to fetch updated vote count');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to vote');
        console.error('Vote failed:', error);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/${requestId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to update status' }));
        throw new Error(error.error || 'Failed to update status');
      }

      // Don't reload immediately - let the board component handle the state update
      // This prevents re-renders during drag operations
      // The board will update its local state, and we can reload on next page load
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
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

  const handleSubmitRequest = async (
    data: {
      title: string;
      description: string;
      category_id: string;
      tags: string[];
      is_public: boolean;
    },
    attachment?: File | null
  ) => {
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
      console.log('Has attachment:', !!attachment);

      // Use FormData if there's an attachment, otherwise use JSON
      let response: Response;
      if (attachment) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('is_public', String(data.is_public));
        if (data.category_id) {
          formData.append('category_id', data.category_id);
        }
        formData.append('attachment', attachment);

        response = await fetch('/api/feature-requests', {
          method: 'POST',
          headers: {
            'X-User-Id': user.id, // Send user ID as header fallback
          },
          credentials: 'include', // Ensure cookies are sent
          body: formData,
        });
      } else {
        response = await fetch('/api/feature-requests', {
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
      }

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <FeatureRequestSearch
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
              />
            </div>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid View
                </Button>
                <Button
                  variant={viewMode === 'board' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                >
                  Board View
                </Button>
              </div>
            )}
          </div>
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
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {featureRequests.length} of {totalCount} feature
                  requests
                </p>

                {viewMode === 'grid' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Page {currentPage} of {totalPages}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Feature Requests View */}
              {user?.role === 'admin' && viewMode === 'board' ? (
                <FeatureRequestBoard
                  featureRequests={featureRequests}
                  onStatusUpdate={handleStatusUpdate}
                  onVote={handleVote}
                  onClick={async request => {
                    setSelectedRequest(request);
                    setIsDetailModalOpen(true);
                    // Load comments when modal opens
                    if (request.id) {
                      await loadComments(request.id);
                    }
                  }}
                />
              ) : (
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
              )}

              {/* Pagination - Only show in grid view */}
              {viewMode === 'grid' && totalPages > 1 && (
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
              setAttachmentImageUrl(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <DialogTitle className="text-2xl">
                          {selectedRequest.title}
                        </DialogTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(
                            selectedRequest.created_at
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <DialogDescription className="text-base mb-4">
                        {selectedRequest.description}
                      </DialogDescription>
                      {/* Attachment */}
                      {selectedRequest.attachment_url &&
                        (() => {
                          const fileName =
                            selectedRequest.attachment_url.split('/').pop() ||
                            '';
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                            fileName
                          );

                          return (
                            <div className="mt-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Attachment
                                    </span>
                                  </div>
                                  {!isImage && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const headers: HeadersInit = {
                                            'Content-Type': 'application/json',
                                          };
                                          if (user?.id) {
                                            headers['x-user-id'] = user.id;
                                          }

                                          const response = await fetch(
                                            `/api/feature-requests/${selectedRequest.id}/attachment`,
                                            {
                                              credentials: 'include',
                                              headers,
                                            }
                                          );
                                          if (response.ok) {
                                            const data = await response.json();
                                            window.open(data.url, '_blank');
                                          } else {
                                            const errorData = await response
                                              .json()
                                              .catch(() => ({}));
                                            console.error(
                                              'Failed to load attachment:',
                                              errorData
                                            );
                                            toast.error(
                                              errorData.error ||
                                                'Failed to load attachment'
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            'Error loading attachment:',
                                            error
                                          );
                                          toast.error(
                                            'Failed to load attachment'
                                          );
                                        }
                                      }}
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      View
                                    </Button>
                                  )}
                                </div>
                                {isImage && (
                                  <div className="mt-3">
                                    {isLoadingAttachment ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                                      </div>
                                    ) : attachmentImageUrl ? (
                                      <div className="rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                          src={attachmentImageUrl}
                                          alt="Attachment"
                                          className="w-full h-auto max-h-96 object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 py-2">
                                        Failed to load image
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      {/* Creator Information */}
                      {selectedRequest.profiles && (
                        <div className="flex items-center gap-3 mb-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={selectedRequest.profiles.avatar_url}
                              alt={`${selectedRequest.profiles.first_name} ${selectedRequest.profiles.last_name}`}
                            />
                            <AvatarFallback>
                              {selectedRequest.profiles.first_name?.[0]}
                              {selectedRequest.profiles.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {selectedRequest.profiles.first_name}{' '}
                              {selectedRequest.profiles.last_name}
                            </span>
                            {selectedRequest.users?.role && (
                              <Badge
                                variant="secondary"
                                className="w-fit mt-0.5 text-xs"
                              >
                                {selectedRequest.users.role === 'admin'
                                  ? 'Admin'
                                  : selectedRequest.users.role === 'contractor'
                                    ? 'Contractor'
                                    : selectedRequest.users.role ===
                                        'event_manager'
                                      ? 'Event Manager'
                                      : selectedRequest.users.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {selectedRequest.is_featured && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800 border-yellow-200"
                          >
                            Featured
                          </Badge>
                        )}
                        {selectedRequest.feature_request_categories && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  selectedRequest.feature_request_categories
                                    .color,
                              }}
                            />
                            {selectedRequest.feature_request_categories.name}
                          </Badge>
                        )}
                        {selectedRequest.feature_request_tag_assignments &&
                          selectedRequest.feature_request_tag_assignments
                            .length > 0 &&
                          selectedRequest.feature_request_tag_assignments.map(
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
                        <Badge
                          className={`flex items-center gap-1 ${
                            selectedRequest.status === 'submitted'
                              ? 'bg-blue-100 text-blue-800'
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
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setShowDeleteDialog(true)}
                            title="Delete request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-0 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Comments</p>
                        <p className="text-lg font-bold">{comments.length}</p>
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

        {/* Image Preview Dialog */}
        <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Attachment Preview</DialogTitle>
            </DialogHeader>
            {imagePreviewUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={imagePreviewUrl}
                  alt="Attachment preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (imagePreviewUrl) {
                    window.open(imagePreviewUrl, '_blank');
                  }
                }}
              >
                Open in New Tab
              </Button>
              <Button onClick={() => setShowImagePreview(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Feature Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this feature request? This will
                permanently delete the request and all associated comments. This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
