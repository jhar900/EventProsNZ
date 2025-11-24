'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ThumbsUp,
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
} from 'lucide-react';

interface FeatureRequestCardProps {
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
  category?: {
    name: string;
    color: string;
  };
  tags?: Array<{ name: string }>;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  comments_count?: number;
  is_featured?: boolean;
  is_public?: boolean;
  className?: string;
  showVoting?: boolean;
  onVote?: (featureRequestId: string, voteType: 'upvote') => void;
  onClick?: () => void;
  user_vote?: 'upvote' | null;
}

export default function FeatureRequestCard({
  id,
  title,
  description,
  status,
  priority,
  vote_count,
  view_count,
  created_at,
  updated_at,
  category,
  tags,
  author,
  comments_count = 0,
  is_featured = false,
  is_public = true,
  className = '',
  showVoting = true,
  onVote,
  onClick,
  user_vote: initialUserVote = null,
}: FeatureRequestCardProps) {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | null>(initialUserVote);
  const isVotingRef = useRef(false);

  // Load user vote on mount and when user changes
  useEffect(() => {
    // Don't reload if we're currently voting (to prevent race conditions)
    if (isVotingRef.current) {
      return;
    }

    const loadUserVote = async () => {
      if (!user?.id) {
        setUserVote(null);
        return;
      }

      try {
        const headers: HeadersInit = {};
        if (user?.id) {
          headers['x-user-id'] = user.id;
        }

        const response = await fetch(`/api/feature-requests/${id}/vote`, {
          credentials: 'include',
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setUserVote(data.user_vote === 'upvote' ? 'upvote' : null);
        }
      } catch (error) {
        console.error('Error loading user vote:', error);
      }
    };

    loadUserVote();
  }, [id, user?.id]);

  // Update userVote when initialUserVote prop changes (if parent provides it)
  useEffect(() => {
    if (initialUserVote !== undefined && !isVotingRef.current) {
      setUserVote(initialUserVote);
    }
  }, [initialUserVote]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4" />;
      case 'planned':
        return <Clock className="w-4 h-4" />;
      case 'in_development':
        return <PlayCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-purple-100 text-purple-800';
      case 'in_development':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleVote = async () => {
    if (isVoting) return;

    setIsVoting(true);
    isVotingRef.current = true;

    try {
      // Let the parent handle the vote API call - this ensures vote count updates correctly
      if (onVote) {
        await onVote(id, 'upvote');
      }

      // After parent handles the vote, reload user vote state
      // The parent updates vote_count, we just need to update userVote state
      // Add a small delay to ensure the API has processed the vote
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        const headers: HeadersInit = {};
        if (user?.id) {
          headers['x-user-id'] = user.id;
        }

        const voteResponse = await fetch(`/api/feature-requests/${id}/vote`, {
          credentials: 'include',
          headers,
        });
        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          const newUserVote = voteData.user_vote === 'upvote' ? 'upvote' : null;
          setUserVote(newUserVote);
          console.log('User vote state updated:', newUserVote, voteData);
        }
      } catch (error) {
        console.error('Error reloading vote state:', error);
      }
    } catch (error) {
      console.error('Error voting:', error);
      // On error, reload current vote state
      try {
        const headers: HeadersInit = {};
        if (user?.id) {
          headers['x-user-id'] = user.id;
        }

        const currentVoteResponse = await fetch(
          `/api/feature-requests/${id}/vote`,
          {
            credentials: 'include',
            headers,
          }
        );
        if (currentVoteResponse.ok) {
          const currentVoteData = await currentVoteResponse.json();
          setUserVote(currentVoteData.user_vote === 'upvote' ? 'upvote' : null);
        }
      } catch (reloadError) {
        console.error('Error reloading vote state:', reloadError);
      }
    } finally {
      setIsVoting(false);
      // Delay resetting the ref to prevent useEffect from interfering
      setTimeout(() => {
        isVotingRef.current = false;
      }, 500);
    }
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${is_featured ? 'ring-2 ring-yellow-400' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {onClick ? (
                <span className="hover:text-blue-600 transition-colors">
                  {title}
                </span>
              ) : (
                <Link
                  href={`/feature-requests/${id}`}
                  className="hover:text-blue-600 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {title}
                </Link>
              )}
            </CardTitle>

            <CardDescription className="line-clamp-3 text-sm">
              {description}
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2 ml-2">
            {is_featured && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                Featured
              </Badge>
            )}
            <Badge
              variant={is_public ? 'default' : 'secondary'}
              className={
                is_public
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {is_public ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Status and Category */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            className={`flex items-center gap-1 ${getStatusColor(status)}`}
          >
            {getStatusIcon(status)}
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>

          {category && (
            <Badge variant="outline" className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Voting Section */}
        {showVoting && (
          <div
            className="flex flex-wrap items-center gap-4 mb-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVote}
                disabled={isVoting}
                className={`flex items-center gap-1 ${
                  userVote === 'upvote'
                    ? 'bg-orange-50 hover:bg-orange-100 border-orange-500'
                    : ''
                }`}
              >
                <ThumbsUp
                  className={`w-4 h-4 ${userVote === 'upvote' ? 'text-orange-600' : ''}`}
                />
                <span
                  className={
                    userVote === 'upvote' ? 'text-orange-600 font-medium' : ''
                  }
                >
                  {vote_count > 0 ? vote_count : 0}
                </span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {view_count} views
              </div>

              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {comments_count} {comments_count === 1 ? 'comment' : 'comments'}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-3">
            {author && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={author.avatar_url} />
                  <AvatarFallback>
                    {author.first_name?.[0]}
                    {author.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {author.first_name} {author.last_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(created_at)}
            </div>

            {vote_count > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {vote_count} votes
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
