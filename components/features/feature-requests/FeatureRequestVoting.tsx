'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface VoteData {
  upvotes: number;
  downvotes: number;
  total: number;
  user_vote: 'upvote' | null;
}

interface FeatureRequestVotingProps {
  featureRequestId: string;
  initialVoteCount?: number;
  onVoteChange?: (voteData: VoteData) => void;
  showAnalytics?: boolean;
}

export default function FeatureRequestVoting({
  featureRequestId,
  initialVoteCount = 0,
  onVoteChange,
  showAnalytics = false,
}: FeatureRequestVotingProps) {
  const { user } = useAuth();
  const [voteData, setVoteData] = useState<VoteData>({
    upvotes: 0,
    downvotes: 0,
    total: initialVoteCount,
    user_vote: null,
  });
  const [isVoting, setIsVoting] = useState(false);

  // Load voting data on mount and when user changes
  useEffect(() => {
    const loadVoteData = async () => {
      try {
        const response = await fetch(
          `/api/feature-requests/${featureRequestId}/vote`
        );
        if (response.ok) {
          const data = await response.json();
          const newVoteData = {
            upvotes: data.vote_counts.upvotes,
            downvotes: data.vote_counts.downvotes,
            total: data.vote_counts.total,
            user_vote: data.user_vote,
          };
          setVoteData(newVoteData);
          console.log('Vote data loaded:', newVoteData);
        } else {
          console.error(
            'Failed to load vote data:',
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error('Error loading vote data:', error);
      }
    };

    loadVoteData();
  }, [featureRequestId, user?.id]); // Reload when user changes

  const handleVote = async (voteType: 'upvote') => {
    if (isVoting) return;

    if (!user) {
      toast.error('Please log in to vote on feature requests');
      return;
    }

    setIsVoting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Include user ID in header as fallback if cookies fail
      if (user?.id) {
        headers['x-user-id'] = user.id;
        console.log('Vote - Sending user ID in header:', user.id);
      } else {
        console.log('Vote - No user ID available:', { user, hasUser: !!user });
      }

      const response = await fetch(
        `/api/feature-requests/${featureRequestId}/vote`,
        {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({ vote_type: voteType }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to vote';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
          console.error('Vote error response:', {
            status: response.status,
            statusText: response.statusText,
            error,
          });
        } catch (parseError) {
          const text = await response.text();
          console.error('Vote error (non-JSON):', {
            status: response.status,
            statusText: response.statusText,
            text,
          });
          errorMessage = `Failed to vote: ${response.status} ${response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const result = await response.json();
      console.log('Vote success:', result);

      // Update local state based on the result
      if (result.action === 'removed') {
        setVoteData(prev => ({
          ...prev,
          user_vote: null,
          total: prev.total - 1,
          upvotes: prev.upvotes - 1,
        }));
        toast.success('Vote removed');
      } else if (result.action === 'updated') {
        setVoteData(prev => {
          const newUpvotes = prev.upvotes + 1;
          return {
            ...prev,
            user_vote: voteType,
            total: newUpvotes - prev.downvotes,
            upvotes: newUpvotes,
          };
        });
        toast.success('Vote updated');
      } else if (result.action === 'created') {
        setVoteData(prev => {
          const newUpvotes = prev.upvotes + 1;
          return {
            ...prev,
            user_vote: voteType,
            total: newUpvotes - prev.downvotes,
            upvotes: newUpvotes,
          };
        });
        toast.success('Vote recorded');
      }

      // Reload vote data to ensure consistency
      const reloadResponse = await fetch(
        `/api/feature-requests/${featureRequestId}/vote`,
        {
          credentials: 'include',
        }
      );
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        const updatedVoteData = {
          upvotes: reloadData.vote_counts.upvotes,
          downvotes: reloadData.vote_counts.downvotes,
          total: reloadData.vote_counts.total,
          user_vote: reloadData.user_vote,
        };
        setVoteData(updatedVoteData);

        // Call callback with the updated data
        if (onVoteChange) {
          onVoteChange(updatedVoteData);
        }
      } else {
        // If reload fails, still call callback with current state
        if (onVoteChange) {
          // Use a function to get the latest state
          setVoteData(prev => {
            onVoteChange(prev);
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to vote';
      toast.error(`Vote failed: ${errorMessage}`);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteButtonVariant = () => {
    if (voteData.user_vote === 'upvote') {
      return 'default';
    }
    return 'outline';
  };

  const getVoteButtonClass = () => {
    if (voteData.user_vote === 'upvote') {
      return 'bg-orange-50 hover:bg-orange-100 border-orange-500';
    }
    return '';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={getVoteButtonVariant()}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center gap-2 ${getVoteButtonClass()}`}
              >
                <ThumbsUp
                  className={`w-4 h-4 ${voteData.user_vote === 'upvote' ? 'text-orange-600' : ''}`}
                />
                <span
                  className={
                    voteData.user_vote === 'upvote'
                      ? 'text-orange-600 font-medium'
                      : ''
                  }
                >
                  {voteData.upvotes}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{voteData.total}</span>
                <span>net votes</span>
              </div>

              {showAnalytics && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{voteData.upvotes} total votes</span>
                </div>
              )}
            </div>
          </div>

          {voteData.user_vote === 'upvote' && (
            <div className="text-sm text-gray-600">
              You voted: <span className="font-medium capitalize">upvote</span>
            </div>
          )}
        </div>

        {showAnalytics && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Upvotes</span>
                  <span className="font-medium text-green-600">
                    {voteData.upvotes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${voteData.upvotes > 0 ? 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
