'use client';

import React, { useState } from 'react';
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
import { X, Filter, Search } from 'lucide-react';
import { JOB_TYPES, JOB_SERVICE_CATEGORIES } from '@/types/jobs';

interface JobFiltersProps {
  filters: {
    q?: string;
    job_type?: string;
    service_category?: string;
    location?: string;
    budget_min?: number;
    budget_max?: number;
    is_remote?: boolean;
    status?: string;
  };
  onFiltersChange: (filters: any) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function JobFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key as keyof typeof newFilters];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(
      value => value !== undefined && value !== '' && value !== false
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={onClear}>
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
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Jobs</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by title, description, or location..."
                value={filters.q || ''}
                onChange={e => handleFilterChange('q', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label htmlFor="job_type">Job Type</Label>
            <Select
              value={filters.job_type || ''}
              onValueChange={value =>
                handleFilterChange('job_type', value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All job types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All job types</SelectItem>
                {Object.entries(JOB_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value === 'event_manager'
                      ? 'Event Manager Position'
                      : 'Internal Contractor Role'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Category */}
          <div className="space-y-2">
            <Label htmlFor="service_category">Service Category</Label>
            <Select
              value={filters.service_category || ''}
              onValueChange={value =>
                handleFilterChange('service_category', value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value
                      .replace('_', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Auckland, Wellington"
              value={filters.location || ''}
              onChange={e => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label>Budget Range (NZD)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.budget_min || ''}
                  onChange={e =>
                    handleFilterChange(
                      'budget_min',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.budget_max || ''}
                  onChange={e =>
                    handleFilterChange(
                      'budget_max',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Remote Work */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_remote"
              checked={filters.is_remote || false}
              onCheckedChange={checked =>
                handleFilterChange('is_remote', checked)
              }
            />
            <Label htmlFor="is_remote">Remote work only</Label>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={value =>
                handleFilterChange('status', value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.q && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: {filters.q}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('q')}
                    />
                  </Badge>
                )}
                {filters.job_type && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type:{' '}
                    {filters.job_type === 'event_manager'
                      ? 'Event Manager'
                      : 'Contractor'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('job_type')}
                    />
                  </Badge>
                )}
                {filters.service_category && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Category: {filters.service_category.replace('_', ' ')}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('service_category')}
                    />
                  </Badge>
                )}
                {filters.location && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Location: {filters.location}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('location')}
                    />
                  </Badge>
                )}
                {(filters.budget_min || filters.budget_max) && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Budget: {filters.budget_min || 0} -{' '}
                    {filters.budget_max || '∞'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        handleClearFilter('budget_min');
                        handleClearFilter('budget_max');
                      }}
                    />
                  </Badge>
                )}
                {filters.is_remote && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Remote Only
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('is_remote')}
                    />
                  </Badge>
                )}
                {filters.status && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Status: {filters.status}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleClearFilter('status')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClear}>
              Clear All
            </Button>
            <Button onClick={onSearch}>Apply Filters</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
