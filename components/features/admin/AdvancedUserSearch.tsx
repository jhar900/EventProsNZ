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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  X,
  Save,
  Calendar as CalendarIcon,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchFilters {
  search: string;
  role: string;
  status: string;
  verification: string;
  subscription: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  location: string;
  company: string;
  lastLogin: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

interface AdvancedUserSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch?: (search: SavedSearch) => void;
  onLoadSearch?: (searchId: string) => void;
  savedSearches?: SavedSearch[];
  loading?: boolean;
}

export default function AdvancedUserSearch({
  onSearch,
  onSaveSearch,
  onLoadSearch,
  savedSearches = [],
  loading = false,
}: AdvancedUserSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    role: 'all',
    status: 'all',
    verification: 'all',
    subscription: 'all',
    dateRange: { from: null, to: null },
    location: '',
    company: '',
    lastLogin: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (key: 'from' | 'to', date: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: date },
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;

    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      filters: { ...filters },
      created_at: new Date().toISOString(),
    };

    onSaveSearch?.(savedSearch);
    setSaveSearchName('');
    setShowSaveDialog(false);
  };

  const handleLoadSearch = (searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      setFilters(search.filters);
      onLoadSearch?.(searchId);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      verification: 'all',
      subscription: 'all',
      dateRange: { from: null, to: null },
      location: '',
      company: '',
      lastLogin: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.role !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.verification !== 'all') count++;
    if (filters.subscription !== 'all') count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.location) count++;
    if (filters.company) count++;
    if (filters.lastLogin !== 'all') count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced User Search
            </CardTitle>
            <CardDescription>
              Search and filter users with advanced criteria
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {savedSearches.length > 0 && (
              <Select onValueChange={handleLoadSearch}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load saved search" />
                </SelectTrigger>
                <SelectContent>
                  {savedSearches.map(search => (
                    <SelectItem key={search.id} value={search.id}>
                      {search.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, company..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={filters.role}
                onValueChange={value => handleFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={value => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="verification">Verification</Label>
                <Select
                  value={filters.verification}
                  onValueChange={value =>
                    handleFilterChange('verification', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verification</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subscription">Subscription</Label>
                <Select
                  value={filters.subscription}
                  onValueChange={value =>
                    handleFilterChange('subscription', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subscriptions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscriptions</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="City, state, country..."
                    value={filters.location}
                    onChange={e =>
                      handleFilterChange('location', e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    placeholder="Company name..."
                    value={filters.company}
                    onChange={e =>
                      handleFilterChange('company', e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lastLogin">Last Login</Label>
                <Select
                  value={filters.lastLogin}
                  onValueChange={value =>
                    handleFilterChange('lastLogin', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All login times" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Login Times</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateRange.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, 'PPP')
                        ) : (
                          <span>From date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from || undefined}
                        onSelect={date =>
                          handleDateRangeChange('from', date || null)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateRange.to && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, 'PPP')
                        ) : (
                          <span>To date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to || undefined}
                        onSelect={date =>
                          handleDateRangeChange('to', date || null)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={value => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="last_login">Last Login</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={value =>
                    handleFilterChange('sortOrder', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {filters.role !== 'all' && (
                <Badge variant="secondary">
                  Role: {filters.role}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('role', 'all')}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary">
                  Status: {filters.status}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('status', 'all')}
                  />
                </Badge>
              )}
              {filters.verification !== 'all' && (
                <Badge variant="secondary">
                  Verification: {filters.verification}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('verification', 'all')}
                  />
                </Badge>
              )}
              {filters.subscription !== 'all' && (
                <Badge variant="secondary">
                  Subscription: {filters.subscription}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('subscription', 'all')}
                  />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary">
                  Location: {filters.location}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('location', '')}
                  />
                </Badge>
              )}
              {filters.company && (
                <Badge variant="secondary">
                  Company: {filters.company}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('company', '')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Save Search</CardTitle>
                <CardDescription>
                  Save this search for future use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="searchName">Search Name</Label>
                    <Input
                      id="searchName"
                      placeholder="Enter search name..."
                      value={saveSearchName}
                      onChange={e => setSaveSearchName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSearch}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
