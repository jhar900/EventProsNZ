'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Star,
  User,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface TestimonialFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

interface FilterState {
  search: string;
  category: string;
  status: string;
  rating: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  isVerified: boolean | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: FilterState = {
  search: '',
  category: 'all',
  status: 'all',
  rating: 'all',
  dateRange: {
    from: undefined,
    to: undefined,
  },
  isVerified: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export function TestimonialFilters({
  onFiltersChange,
  className,
}: TestimonialFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Calculate active filters count
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.rating !== 'all') count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.isVerified !== null) count++;
    if (filters.sortBy !== 'created_at' || filters.sortOrder !== 'desc')
      count++;

    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [key]: defaultFilters[key],
    }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const getFilterBadges = () => {
    const badges = [];

    if (filters.search) {
      badges.push({
        key: 'search',
        label: `Search: "${filters.search}"`,
        onRemove: () => clearFilter('search'),
      });
    }

    if (filters.category !== 'all') {
      badges.push({
        key: 'category',
        label: `Category: ${filters.category}`,
        onRemove: () => clearFilter('category'),
      });
    }

    if (filters.status !== 'all') {
      badges.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        onRemove: () => clearFilter('status'),
      });
    }

    if (filters.rating !== 'all') {
      badges.push({
        key: 'rating',
        label: `Rating: ${filters.rating} stars`,
        onRemove: () => clearFilter('rating'),
      });
    }

    if (filters.dateRange.from || filters.dateRange.to) {
      const fromStr = filters.dateRange.from
        ? format(filters.dateRange.from, 'MMM dd')
        : '';
      const toStr = filters.dateRange.to
        ? format(filters.dateRange.to, 'MMM dd')
        : '';
      badges.push({
        key: 'dateRange',
        label: `Date: ${fromStr} - ${toStr}`,
        onRemove: () => clearFilter('dateRange'),
      });
    }

    if (filters.isVerified !== null) {
      badges.push({
        key: 'isVerified',
        label: `Verified: ${filters.isVerified ? 'Yes' : 'No'}`,
        onRemove: () => clearFilter('isVerified'),
      });
    }

    return badges;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {getFilterBadges().map(badge => (
              <Badge
                key={badge.key}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{badge.label}</span>
                <button
                  onClick={badge.onRemove}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search testimonials..."
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={value => updateFilter('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="event_manager">Event Managers</SelectItem>
                  <SelectItem value="contractor">Contractors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={value => updateFilter('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rating and Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={filters.rating}
                onValueChange={value => updateFilter('rating', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verification">Verification</Label>
              <Select
                value={
                  filters.isVerified === null
                    ? 'all'
                    : filters.isVerified
                      ? 'verified'
                      : 'unverified'
                }
                onValueChange={value => {
                  if (value === 'all') {
                    updateFilter('isVerified', null);
                  } else {
                    updateFilter('isVerified', value === 'verified');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date Range</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="dateFrom" className="text-sm text-gray-600">
                  From
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={date =>
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          from: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="dateTo" className="text-sm text-gray-600">
                  To
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={date =>
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          to: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={value => updateFilter('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="feedback">Content</SelectItem>
                  <SelectItem value="user.first_name">User Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={value =>
                  updateFilter('sortOrder', value as 'asc' | 'desc')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
