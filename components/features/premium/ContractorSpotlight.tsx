'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, Star, TrendingUp, Users, Calendar } from 'lucide-react';

interface ContractorSpotlightProps {
  userId?: string;
}

interface SpotlightContractor {
  id: string;
  user_id: string;
  company_name: string;
  description: string;
  service_categories: string[];
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  subscription_tier: string;
  created_at: string;
}

export function ContractorSpotlight({ userId }: ContractorSpotlightProps) {
  const [spotlightContractors, setSpotlightContractors] = useState<
    SpotlightContractor[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadSpotlightContractors();
  }, [userId]);

  const loadSpotlightContractors = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // This would typically be a separate endpoint for spotlight contractors
      // For now, we'll simulate with mock data
      const mockContractors: SpotlightContractor[] = [
        {
          id: '1',
          user_id: 'user1',
          company_name: 'Elite Event Solutions',
          description: 'Premium event planning and coordination services',
          service_categories: ['Event Planning', 'Catering', 'Entertainment'],
          average_rating: 4.9,
          review_count: 127,
          is_verified: true,
          subscription_tier: 'spotlight',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user2',
          company_name: 'Dream Weddings NZ',
          description:
            'Creating magical wedding experiences across New Zealand',
          service_categories: [
            'Wedding Planning',
            'Photography',
            'Floral Design',
          ],
          average_rating: 4.8,
          review_count: 89,
          is_verified: true,
          subscription_tier: 'spotlight',
          created_at: '2024-02-01T10:00:00Z',
        },
        {
          id: '3',
          user_id: 'user3',
          company_name: 'Corporate Events Pro',
          description:
            'Professional corporate event management and coordination',
          service_categories: [
            'Corporate Events',
            'Conference Planning',
            'Team Building',
          ],
          average_rating: 4.7,
          review_count: 156,
          is_verified: true,
          subscription_tier: 'spotlight',
          created_at: '2024-01-20T10:00:00Z',
        },
      ];

      setSpotlightContractors(mockContractors);
      setHasAccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading spotlight contractors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-6 w-6 text-yellow-500" />
            <span>Contractor Spotlight</span>
          </CardTitle>
          <CardDescription>
            Featured contractors on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Spotlight Not Available
            </h3>
            <p className="text-gray-500 mb-4">
              Upgrade to Spotlight plan to get featured on the homepage.
            </p>
            <Button>Upgrade to Spotlight</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spotlight Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-6 w-6 text-yellow-500" />
            <span>Contractor Spotlight</span>
          </CardTitle>
          <CardDescription>
            Featured contractors that appear on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {spotlightContractors.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Featured Contractors
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {spotlightContractors.length > 0
                    ? (
                        spotlightContractors.reduce(
                          (acc, c) => acc + c.average_rating,
                          0
                        ) / spotlightContractors.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {spotlightContractors.reduce(
                    (acc, c) => acc + c.review_count,
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Contractors */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Contractors</CardTitle>
          <CardDescription>
            Spotlight contractors currently featured on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spotlightContractors.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Featured Contractors
              </h3>
              <p className="text-gray-500">
                No contractors are currently featured in the spotlight.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spotlightContractors.map(contractor => (
                <div
                  key={contractor.id}
                  className="flex flex-col p-6 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {contractor.company_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contractor.description}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Spotlight
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {contractor.average_rating.toFixed(1)} (
                        {contractor.review_count} reviews)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {contractor.service_categories
                        .slice(0, 3)
                        .map((category, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                      {contractor.service_categories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contractor.service_categories.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        {contractor.is_verified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spotlight Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Spotlight Benefits</CardTitle>
          <CardDescription>What makes the spotlight special</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium">Homepage Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Featured prominently on the homepage for maximum exposure
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium">Priority Placement</h4>
                  <p className="text-sm text-muted-foreground">
                    Appear first in search results and category listings
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium">Increased Traffic</h4>
                  <p className="text-sm text-muted-foreground">
                    Get more profile views and inquiries from featured placement
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium">Premium Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Stand out as a premium service provider in your category
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
