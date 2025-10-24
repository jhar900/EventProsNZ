'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface VoteData {
  upvotes: number;
  downvotes: number;
  total: number;
  user_vote: 'upvote' | 'downvote' | null;
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
  const [voteData, setVoteData] = useState<VoteData>({
    upvotes: 0,
    downvotes: 0,
    total: initialVoteCount,
    user_vote: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Load voting data on mount
  useEffect(() => {
    const loadVoteData = async () => {
      try {
        const response = await fetch(
          `/api/feature-requests/${featureRequestId}/vote`
        );
        if (response.ok) {
          const data = await response.json();
          setVoteData({
            upvotes: data.vote_counts.upvotes,
            downvotes: data.vote_counts.downvotes,
            total: data.vote_counts.total,
            user_vote: data.user_vote,
          });
        }
      } catch (error) {
        console.error('Error loading vote data:', error);
      }
    };

    loadVoteData();
  }, [featureRequestId]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;

    setIsVoting(true);
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
        const result = await response.json();

        // Update local state based on the result
        if (result.action === 'removed') {
          setVoteData(prev => ({
            ...prev,
            user_vote: null,
            total: prev.total + (voteType === 'upvote' ? -1 : 1),
            upvotes: voteType === 'upvote' ? prev.upvotes - 1 : prev.upvotes,
            downvotes:
              voteType === 'downvote' ? prev.downvotes - 1 : prev.downvotes,
          }));
          toast.success('Vote removed');
        } else if (result.action === 'updated') {
          setVoteData(prev => {
            const newUpvotes =
              voteType === 'upvote' ? prev.upvotes + 1 : prev.upvotes - 1;
            const newDownvotes =
              voteType === 'downvote' ? prev.downvotes + 1 : prev.downvotes - 1;
            return {
              ...prev,
              user_vote: voteType,
              total: newUpvotes - newDownvotes,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
            };
          });
          toast.success('Vote updated');
        } else if (result.action === 'created') {
          setVoteData(prev => {
            const newUpvotes =
              voteType === 'upvote' ? prev.upvotes + 1 : prev.upvotes;
            const newDownvotes =
              voteType === 'downvote' ? prev.downvotes + 1 : prev.downvotes;
            return {
              ...prev,
              user_vote: voteType,
              total: newUpvotes - newDownvotes,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
            };
          });
          toast.success('Vote recorded');
        }

        if (onVoteChange) {
          onVoteChange(voteData);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteButtonVariant = (voteType: 'upvote' | 'downvote') => {
    if (voteData.user_vote === voteType) {
      return 'default';
    }
    return 'outline';
  };

  const getVoteButtonClass = (voteType: 'upvote' | 'downvote') => {
    if (voteData.user_vote === voteType) {
      return voteType === 'upvote'
        ? 'bg-green-500 hover:bg-green-600 text-white'
        : 'bg-red-500 hover:bg-red-600 text-white';
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
                variant={getVoteButtonVariant('upvote')}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center gap-2 ${getVoteButtonClass('upvote')}`}
              >
                <ThumbsUp className="w-4 h-4" />
                {voteData.upvotes}
              </Button>
              <Button
                variant={getVoteButtonVariant('downvote')}
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={`flex items-center gap-2 ${getVoteButtonClass('downvote')}`}
              >
                <ThumbsDown className="w-4 h-4" />
                {voteData.downvotes}
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
                  <span>
                    {voteData.upvotes + voteData.downvotes} total votes
                  </span>
                </div>
              )}
            </div>
          </div>

          {voteData.user_vote && (
            <div className="text-sm text-gray-600">
              You voted:{' '}
              <span className="font-medium capitalize">
                {voteData.user_vote}
              </span>
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
                      width: `${
                        voteData.upvotes + voteData.downvotes > 0
                          ? (voteData.upvotes /
                              (voteData.upvotes + voteData.downvotes)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Downvotes</span>
                  <span className="font-medium text-red-600">
                    {voteData.downvotes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        voteData.upvotes + voteData.downvotes > 0
                          ? (voteData.downvotes /
                              (voteData.upvotes + voteData.downvotes)) *
                            100
                          : 0
                      }%`,
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
