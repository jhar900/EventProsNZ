'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import FeatureRequestVoting from '@/components/features/feature-requests/FeatureRequestVoting';
import FeatureRequestStatus from '@/components/features/feature-requests/FeatureRequestStatus';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FeatureRequest {
  id: string;
  user_id: string;
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
  feature_request_comments?: Array<{
    id: string;
    content: string;
    is_admin_comment: boolean;
    created_at: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  }>;
}

export default function FeatureRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [featureRequest, setFeatureRequest] = useState<FeatureRequest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load feature request data
  useEffect(() => {
    const loadFeatureRequest = async () => {
      try {
        const response = await fetch(`/api/feature-requests/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setFeatureRequest(data);
        } else if (response.status === 404) {
          toast.error('Feature request not found');
          router.push('/feature-requests');
        } else {
          toast.error('Failed to load feature request');
        }
      } catch (error) {
        console.error('Error loading feature request:', error);
        toast.error('Failed to load feature request');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadFeatureRequest();
    }
  }, [params.id, router]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

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
        // Reload the feature request to get updated vote counts
        const updatedResponse = await fetch(
          `/api/feature-requests/${params.id}`
        );
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setFeatureRequest(data);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await fetch(
        `/api/feature-requests/${params.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (response.ok) {
        const comment = await response.json();
        setFeatureRequest(prev =>
          prev
            ? {
                ...prev,
                feature_request_comments: [
                  ...(prev.feature_request_comments || []),
                  comment,
                ],
              }
            : null
        );
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwner = user && featureRequest && user.id === featureRequest.user_id;

  const handleDelete = async () => {
    if (!featureRequest) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/feature-requests/${featureRequest.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Feature request deleted successfully');
        router.push('/feature-requests');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete feature request');
      }
    } catch (error) {
      console.error('Error deleting feature request:', error);
      toast.error('Failed to delete feature request');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!featureRequest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Feature request not found
            </h3>
            <p className="text-gray-600 mb-4">
              The feature request you&apos;re looking for doesn&apos;t exist or
              has been removed.
            </p>
            <Link href="/feature-requests">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feature Requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/feature-requests">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requests
            </Button>
          </Link>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Request
            </Button>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{featureRequest.title}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {featureRequest.view_count} views
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(featureRequest.created_at)}
                </span>
              </div>

              {featureRequest.is_featured && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">
                  {featureRequest.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Voting */}
          <FeatureRequestVoting
            featureRequestId={featureRequest.id}
            initialVoteCount={featureRequest.vote_count}
            onVoteChange={voteData => {
              setFeatureRequest(prev =>
                prev
                  ? {
                      ...prev,
                      vote_count: voteData.total,
                    }
                  : null
              );
            }}
            showAnalytics={true}
          />

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments ({featureRequest.feature_request_comments?.length || 0}
                )
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <Label htmlFor="new-comment">Add a comment</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this feature request..."
                  rows={3}
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>

              {/* Comments List */}
              {featureRequest.feature_request_comments &&
              featureRequest.feature_request_comments.length > 0 ? (
                <div className="space-y-4">
                  {featureRequest.feature_request_comments
                    .sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    )
                    .map(comment => (
                      <div
                        key={comment.id}
                        className="flex gap-3 p-4 bg-gray-50 rounded-lg"
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
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <FeatureRequestStatus
            featureRequestId={featureRequest.id}
            currentStatus={featureRequest.status}
            isAdmin={isAdmin}
            onStatusChange={(newStatus, comments) => {
              setFeatureRequest(prev =>
                prev
                  ? {
                      ...prev,
                      status: newStatus as any,
                    }
                  : null
              );
            }}
          />

          {/* Author Info */}
          {featureRequest.profiles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Author
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={featureRequest.profiles.avatar_url} />
                    <AvatarFallback>
                      {featureRequest.profiles.first_name[0]}
                      {featureRequest.profiles.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {featureRequest.profiles.first_name}{' '}
                      {featureRequest.profiles.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Feature Request Author
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category and Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureRequest.feature_request_categories && (
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 w-fit"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            featureRequest.feature_request_categories.color,
                        }}
                      />
                      {featureRequest.feature_request_categories.name}
                    </Badge>
                  </div>
                </div>
              )}

              {featureRequest.feature_request_tag_assignments &&
                featureRequest.feature_request_tag_assignments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {featureRequest.feature_request_tag_assignments.map(
                        (assignment, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {assignment.feature_request_tags.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

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
  );
}
