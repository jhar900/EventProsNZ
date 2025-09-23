'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Users,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  Search,
  Heart,
  MessageCircle,
  Calendar,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  ThumbsUp,
  Eye,
  Bookmark,
} from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  website?: string;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  services: string[];
  specializations: string[];
  rating: number;
  reviewCount: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  availability: {
    isAvailable: boolean;
    nextAvailableDate?: string;
  };
  portfolio: {
    images: string[];
    videos: string[];
    description: string;
  };
  certifications: string[];
  experience: number; // years
  isVerified: boolean;
  isPremium: boolean;
  responseTime: string;
  completionRate: number;
  lastActive: string;
}

interface ContractorRecommendation {
  contractor: Contractor;
  matchScore: number;
  reasoning: string[];
  estimatedCost: number;
  estimatedTimeline: string;
  availability: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface ContractorRecommendationsProps {
  serviceId: string;
  serviceName: string;
  eventType: string;
  eventData?: {
    location?: string;
    budget?: number;
    guestCount?: number;
    eventDate?: string;
    requirements?: string[];
  };
  onContractorSelect?: (contractor: Contractor) => void;
  onContractorContact?: (contractor: Contractor) => void;
  className?: string;
}

export function ContractorRecommendations({
  serviceId,
  serviceName,
  eventType,
  eventData,
  onContractorSelect,
  onContractorContact,
  className = '',
}: ContractorRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    ContractorRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    location: '',
    priceRange: '',
    rating: '',
    availability: '',
    verified: false,
  });
  const [sortBy, setSortBy] = useState('matchScore');
  const [activeTab, setActiveTab] = useState('recommendations');

  useEffect(() => {
    loadContractorRecommendations();
  }, [serviceId, eventType, eventData, filters]);

  const loadContractorRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        service_id: serviceId,
        service_name: serviceName,
        event_type: eventType,
      });

      if (eventData) {
        if (eventData.location) params.append('location', eventData.location);
        if (eventData.budget)
          params.append('budget', eventData.budget.toString());
        if (eventData.guestCount)
          params.append('guest_count', eventData.guestCount.toString());
        if (eventData.eventDate)
          params.append('event_date', eventData.eventDate);
      }

      // Add filters
      if (filters.location) params.append('filter_location', filters.location);
      if (filters.priceRange)
        params.append('filter_price_range', filters.priceRange);
      if (filters.rating) params.append('filter_rating', filters.rating);
      if (filters.availability)
        params.append('filter_availability', filters.availability);
      if (filters.verified) params.append('filter_verified', 'true');

      const response = await fetch(
        `/api/contractors/recommendations?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to load contractor recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load recommendations'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Sort recommendations based on selected criteria
    setRecommendations(prev => {
      const sorted = [...prev].sort((a, b) => {
        switch (value) {
          case 'matchScore':
            return b.matchScore - a.matchScore;
          case 'rating':
            return b.contractor.rating - a.contractor.rating;
          case 'price':
            return a.estimatedCost - b.estimatedCost;
          case 'distance':
            // This would require distance calculation
            return 0;
          default:
            return 0;
        }
      });
      return sorted;
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(price);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading contractor recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Contractor Recommendations</h3>
          <p className="text-muted-foreground">
            AI-matched contractors for {serviceName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadContractorRecommendations}
          >
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="location-filter">Location</Label>
              <Input
                id="location-filter"
                placeholder="City or region"
                value={filters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="price-filter">Price Range</Label>
              <Select
                value={filters.priceRange}
                onValueChange={value => handleFilterChange('priceRange', value)}
              >
                <SelectTrigger id="price-filter">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-1000">Under $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="over-10000">Over $10,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating-filter">Minimum Rating</Label>
              <Select
                value={filters.rating}
                onValueChange={value => handleFilterChange('rating', value)}
              >
                <SelectTrigger id="rating-filter">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                  <SelectItem value="4.0">4.0+ stars</SelectItem>
                  <SelectItem value="3.5">3.5+ stars</SelectItem>
                  <SelectItem value="3.0">3.0+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="availability-filter">Availability</Label>
              <Select
                value={filters.availability}
                onValueChange={value =>
                  handleFilterChange('availability', value)
                }
              >
                <SelectTrigger id="availability-filter">
                  <SelectValue placeholder="Any availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger id="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    location: '',
                    priceRange: '',
                    rating: '',
                    availability: '',
                    verified: false,
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {recommendations.length} contractors found for {serviceName}
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </Button>
          <Button
            variant={activeTab === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('map')}
          >
            Map View
          </Button>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No contractors found matching your criteria. Try adjusting your
              filters.
            </AlertDescription>
          </Alert>
        ) : (
          recommendations.map(recommendation => (
            <Card
              key={recommendation.contractor.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">
                        {recommendation.contractor.businessName}
                      </h4>
                      {recommendation.contractor.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {recommendation.contractor.isPremium && (
                        <Badge variant="default" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {recommendation.contractor.location.city},{' '}
                          {recommendation.contractor.location.region}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {recommendation.contractor.rating} (
                          {recommendation.contractor.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {recommendation.contractor.experience} years
                          experience
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatPrice(recommendation.estimatedCost)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Estimated cost
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">
                            {recommendation.estimatedTimeline}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Timeline
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium">
                            {recommendation.contractor.completionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completion rate
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">
                        Why this contractor matches:
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {recommendation.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      {recommendation.contractor.services
                        .slice(0, 3)
                        .map(service => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                      {recommendation.contractor.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recommendation.contractor.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${getMatchScoreColor(recommendation.matchScore)}`}
                      >
                        {recommendation.matchScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Match Score
                      </div>
                    </div>

                    <Badge
                      className={getPriorityColor(recommendation.priority)}
                    >
                      {recommendation.priority} priority
                    </Badge>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          onContractorSelect?.(recommendation.contractor)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onContractorContact?.(recommendation.contractor)
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
