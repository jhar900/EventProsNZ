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
import {
  Loader2,
  Star,
  Eye,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

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
  location: string;
  website: string;
  phone: string;
  email: string;
  created_at: string;
}

interface HomepageServiceSelectionProps {
  limit?: number;
  showTitle?: boolean;
}

export function HomepageServiceSelection({
  limit = 6,
  showTitle = true,
}: HomepageServiceSelectionProps) {
  const [spotlightContractors, setSpotlightContractors] = useState<
    SpotlightContractor[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpotlightContractors();
  }, []);

  const loadSpotlightContractors = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // This would typically fetch from a dedicated endpoint
      // For now, we'll simulate with mock data
      const mockContractors: SpotlightContractor[] = [
        {
          id: '1',
          user_id: 'user1',
          company_name: 'Elite Event Solutions',
          description:
            'Premium event planning and coordination services with over 10 years of experience.',
          service_categories: ['Event Planning', 'Catering', 'Entertainment'],
          average_rating: 4.9,
          review_count: 127,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Auckland, NZ',
          website: 'https://eliteevents.co.nz',
          phone: '+64 9 123 4567',
          email: 'info@eliteevents.co.nz',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user2',
          company_name: 'Dream Weddings NZ',
          description:
            'Creating magical wedding experiences across New Zealand with personalized service.',
          service_categories: [
            'Wedding Planning',
            'Photography',
            'Floral Design',
          ],
          average_rating: 4.8,
          review_count: 89,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Wellington, NZ',
          website: 'https://dreamweddings.nz',
          phone: '+64 4 987 6543',
          email: 'hello@dreamweddings.nz',
          created_at: '2024-02-01T10:00:00Z',
        },
        {
          id: '3',
          user_id: 'user3',
          company_name: 'Corporate Events Pro',
          description:
            'Professional corporate event management and coordination for businesses.',
          service_categories: [
            'Corporate Events',
            'Conference Planning',
            'Team Building',
          ],
          average_rating: 4.7,
          review_count: 156,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Christchurch, NZ',
          website: 'https://corporateeventspro.co.nz',
          phone: '+64 3 456 7890',
          email: 'contact@corporateeventspro.co.nz',
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: '4',
          user_id: 'user4',
          company_name: 'Luxury Catering Co',
          description:
            'High-end catering services for special occasions and corporate events.',
          service_categories: ['Catering', 'Fine Dining', 'Corporate Events'],
          average_rating: 4.9,
          review_count: 203,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Auckland, NZ',
          website: 'https://luxurycatering.co.nz',
          phone: '+64 9 234 5678',
          email: 'info@luxurycatering.co.nz',
          created_at: '2024-01-10T10:00:00Z',
        },
        {
          id: '5',
          user_id: 'user5',
          company_name: 'Entertainment Central',
          description:
            'Professional entertainment services including live music, DJs, and performers.',
          service_categories: ['Entertainment', 'Live Music', 'DJ Services'],
          average_rating: 4.6,
          review_count: 94,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Hamilton, NZ',
          website: 'https://entertainmentcentral.nz',
          phone: '+64 7 345 6789',
          email: 'bookings@entertainmentcentral.nz',
          created_at: '2024-02-15T10:00:00Z',
        },
        {
          id: '6',
          user_id: 'user6',
          company_name: 'Floral Artistry',
          description:
            'Beautiful floral arrangements and decorations for all occasions.',
          service_categories: [
            'Floral Design',
            'Wedding Flowers',
            'Event Decor',
          ],
          average_rating: 4.8,
          review_count: 142,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Dunedin, NZ',
          website: 'https://floralartistry.co.nz',
          phone: '+64 3 567 8901',
          email: 'orders@floralartistry.co.nz',
          created_at: '2024-01-25T10:00:00Z',
        },
      ];

      setSpotlightContractors(mockContractors.slice(0, limit));
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
        <span className="ml-2">Loading featured contractors...</span>
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

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Featured Contractors</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our spotlight contractors - premium service providers with
            verified excellence.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spotlightContractors.map(contractor => (
          <Card
            key={contractor.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {contractor.company_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {contractor.description}
                  </CardDescription>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Spotlight
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating and Reviews */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">
                    {contractor.average_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({contractor.review_count} reviews)
                </span>
                {contractor.is_verified && (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>

              {/* Service Categories */}
              <div className="flex flex-wrap gap-1">
                {contractor.service_categories
                  .slice(0, 3)
                  .map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                {contractor.service_categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{contractor.service_categories.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{contractor.location}</span>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                {contractor.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contractor.phone}</span>
                  </div>
                )}
                {contractor.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{contractor.email}</span>
                  </div>
                )}
                {contractor.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={contractor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button size="sm" variant="outline">
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          View All Spotlight Contractors
        </Button>
      </div>

      {/* Spotlight Benefits */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <h3 className="text-xl font-semibold text-yellow-900">
                Why Choose Spotlight Contractors?
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Verified Excellence</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Premium Visibility</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Top Ratings</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
