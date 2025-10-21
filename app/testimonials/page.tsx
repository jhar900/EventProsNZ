'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestimonialModeration } from '@/components/features/testimonials/TestimonialModeration';
import { TestimonialFilters } from '@/components/features/testimonials/TestimonialFilters';
import { TestimonialSearch } from '@/components/features/testimonials/TestimonialSearch';
import {
  Shield,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Filter,
  Search,
} from 'lucide-react';

interface Testimonial {
  id: string;
  rating: number;
  review_text: string;
  is_verified: boolean;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
  contractor: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
  };
  event_manager: {
    id: string;
    first_name: string;
    last_name: string;
  };
  inquiry: {
    id: string;
    subject: string;
    status: string;
    created_at: string;
  };
  moderation?: {
    id: string;
    moderation_status: string;
    moderation_notes?: string;
    moderated_at: string;
    moderator: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }[];
}

interface TestimonialsPageProps {
  // Props for server-side rendering if needed
}

export default function TestimonialsPage({}: TestimonialsPageProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    moderator_id: '',
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTestimonials();
  }, [filters, searchQuery]);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...filters,
        search: searchQuery,
      });

      const response = await fetch(`/api/testimonials/moderation?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }

      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleModerationUpdate = () => {
    fetchTestimonials();
  };

  // Calculate statistics
  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => !t.is_approved).length,
    approved: testimonials.filter(t => t.is_approved).length,
    flagged: testimonials.filter(
      t =>
        t.moderation &&
        t.moderation.some(m => m.moderation_status === 'flagged')
    ).length,
    averageRating:
      testimonials.length > 0
        ? testimonials.reduce((sum, t) => sum + t.rating, 0) /
          testimonials.length
        : 0,
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  fetchTestimonials();
                }}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Testimonial Moderation
            </h1>
            <p className="text-gray-600 mt-2">
              Review and moderate contractor testimonials
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              <Shield className="h-3 w-3 mr-1" />
              Admin Panel
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">
                    Total Testimonials
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.approved}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <TestimonialFilters
              filters={{
                rating: '',
                verified: '',
                approved: '',
                search: searchQuery,
              }}
              onFilterChange={newFilters => {
                // Convert testimonial filters to moderation filters
                handleFilterChange({
                  ...filters,
                  status: newFilters.approved || '',
                  page: 1,
                });
              }}
            />
          </div>
          <div className="w-full lg:w-80">
            <TestimonialSearch
              onSearch={handleSearch}
              placeholder="Search testimonials..."
            />
          </div>
        </div>

        {/* Moderation Interface */}
        <TestimonialModeration
          testimonials={testimonials}
          isLoading={isLoading}
          onModerationUpdate={handleModerationUpdate}
        />
      </div>
    </div>
  );
}
