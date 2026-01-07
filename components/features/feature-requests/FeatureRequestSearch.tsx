'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Search,
  SortAsc,
  SortDesc,
  X,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SearchFilters {
  search: string;
  status: string;
  category_id: string;
  sort: 'newest' | 'oldest' | 'most_voted' | 'least_voted';
  user_id?: string;
}

interface FeatureRequestSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  showUserFilter?: boolean;
  className?: string;
}

export default function FeatureRequestSearch({
  onFiltersChange,
  initialFilters = {},
  showUserFilter = false,
  className = '',
}: FeatureRequestSearchProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    category_id: '',
    sort: 'newest',
    ...initialFilters,
  });

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/feature-requests/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category_id: '',
      sort: 'newest',
      ...(showUserFilter && { user_id: '' }),
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.category_id ||
    (showUserFilter && filters.user_id);

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: SortDesc },
    { value: 'oldest', label: 'Oldest First', icon: SortAsc },
    { value: 'most_voted', label: 'Most Voted', icon: TrendingUp },
    { value: 'least_voted', label: 'Least Voted', icon: TrendingUp },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_development', label: 'In Development' },
    { value: 'completed', label: 'Completed' },
    // Only show rejected option for admins
    ...(user?.role === 'admin'
      ? [{ value: 'rejected', label: 'Rejected' }]
      : []),
  ];

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Feature Requests
        </CardTitle>
        <CardDescription>
          Find feature requests by searching, filtering, and sorting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Search by title or description..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={value => updateFilter('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(value: any) => updateFilter('sort', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {filters.search}
                  <button
                    type="button"
                    onClick={() => updateFilter('search', '')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status:{' '}
                  {statusOptions.find(s => s.value === filters.status)?.label}
                  <button
                    type="button"
                    onClick={() => updateFilter('status', '')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.category_id && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category:{' '}
                  {categories.find(c => c.id === filters.category_id)?.name}
                  <button
                    type="button"
                    onClick={() => updateFilter('category_id', '')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
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
