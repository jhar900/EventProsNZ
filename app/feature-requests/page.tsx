'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Search, TrendingUp, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import FeatureRequestSearch from '@/components/features/feature-requests/FeatureRequestSearch';
import FeatureRequestCard from '@/components/features/feature-requests/FeatureRequestCard';
import { toast } from 'sonner';

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
}

interface SearchFilters {
  search: string;
  status: string;
  category_id: string;
  sort: 'newest' | 'oldest' | 'most_voted' | 'least_voted';
  user_id?: string;
}

export default function FeatureRequestsPage() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

        const response = await fetch(`/api/feature-requests?${params}`);
        if (response.ok) {
          const data = await response.json();
          setFeatureRequests(data.featureRequests || []);
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        } else {
          toast.error('Failed to load feature requests');
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

          <Link href="/feature-requests/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Submit Request
            </Button>
          </Link>
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
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
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
                  onVote={handleVote}
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
              <Link href="/feature-requests/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
