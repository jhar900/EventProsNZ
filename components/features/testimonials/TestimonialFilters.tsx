'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface TestimonialFilters {
  rating: string;
  verified: string;
  approved: string;
  search: string;
}

interface TestimonialFiltersProps {
  filters: TestimonialFilters;
  onFilterChange: (filters: TestimonialFilters) => void;
}

export function TestimonialFilters({
  filters,
  onFilterChange,
}: TestimonialFiltersProps) {
  const handleRatingChange = (rating: string) => {
    onFilterChange({ ...filters, rating: rating === 'all' ? '' : rating });
  };

  const handleVerifiedChange = (verified: string) => {
    onFilterChange({
      ...filters,
      verified: verified === 'all' ? '' : verified,
    });
  };

  const handleApprovedChange = (approved: string) => {
    onFilterChange({
      ...filters,
      approved: approved === 'all' ? '' : approved,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      rating: '',
      verified: '',
      approved: '',
      search: filters.search, // Keep search term
    });
  };

  const hasActiveFilters =
    filters.rating || filters.verified || filters.approved;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Rating</label>
            <Select
              value={filters.rating || 'all'}
              onValueChange={handleRatingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="2">2+ stars</SelectItem>
                <SelectItem value="1">1+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verified Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Verification
            </label>
            <Select
              value={filters.verified || 'all'}
              onValueChange={handleVerifiedChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All testimonials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All testimonials</SelectItem>
                <SelectItem value="true">Verified only</SelectItem>
                <SelectItem value="false">Unverified only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approved Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={filters.approved || 'all'}
              onValueChange={handleApprovedChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Approved only</SelectItem>
                <SelectItem value="false">Pending only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.rating && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>Rating: {filters.rating} stars</span>
                  <button
                    onClick={() => handleRatingChange('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.verified && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>
                    Verified: {filters.verified === 'true' ? 'Yes' : 'No'}
                  </span>
                  <button
                    onClick={() => handleVerifiedChange('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.approved && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>
                    Status:{' '}
                    {filters.approved === 'true' ? 'Approved' : 'Pending'}
                  </span>
                  <button
                    onClick={() => handleApprovedChange('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
