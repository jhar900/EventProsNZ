'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  JobFilters as JobFiltersType,
  JOB_SERVICE_CATEGORIES,
  JOB_TYPES,
} from '@/types/jobs';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: JobFiltersType) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  className?: string;
}

const LOCATIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Napier',
  'Dunedin',
  'Palmerston North',
  'Nelson',
  'Rotorua',
  'Remote',
];

const BUDGET_RANGES = [
  { label: 'Under $500', min: 0, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: '$1,000 - $2,500', min: 1000, max: 2500 },
  { label: '$2,500 - $5,000', min: 2500, max: 5000 },
  { label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { label: 'Over $10,000', min: 10000, max: undefined },
];

export function JobFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isLoading = false,
  className = '',
}: JobFiltersProps) {
  const [localFilters, setLocalFilters] = useState<JobFiltersType>(filters);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof JobFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultipleFilterChanges = (changes: Partial<JobFiltersType>) => {
    const newFilters = { ...localFilters, ...changes };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleBudgetRangeChange = (value: number[]) => {
    setBudgetRange([value[0], value[1]]);
    handleMultipleFilterChanges({ budget_min: value[0], budget_max: value[1] });
  };

  const clearFilters = () => {
    const clearedFilters: JobFiltersType = {};
    setLocalFilters(clearedFilters);
    setBudgetRange([0, 10000]);
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== null && value !== ''
  );

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(
      value => value !== undefined && value !== null && value !== ''
    ).length;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Job Posted By */}
          <div className="space-y-2">
            <Label htmlFor="job_type">Job Posted By</Label>
            <Select
              value={localFilters.job_type || 'all'}
              onValueChange={value =>
                handleFilterChange(
                  'job_type',
                  value === 'all' ? undefined : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                <SelectItem value="event_manager">Event Manager</SelectItem>
                <SelectItem value="contractor_internal">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Category */}
          <div className="space-y-2">
            <Label htmlFor="service_category">Service Category</Label>
            <Select
              value={localFilters.service_category || 'all'}
              onValueChange={value =>
                handleFilterChange(
                  'service_category',
                  value === 'all' ? undefined : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={localFilters.location || 'all'}
              onValueChange={value =>
                handleFilterChange(
                  'location',
                  value === 'all' ? undefined : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remote Work */}
          <div className="space-y-2">
            <Label>Remote Work</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote_only"
                  checked={localFilters.is_remote === true}
                  onCheckedChange={checked =>
                    handleFilterChange('is_remote', checked ? true : undefined)
                  }
                />
                <Label htmlFor="remote_only" className="text-sm">
                  Remote only
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Budget Range</Label>
            <div className="text-sm text-gray-600">
              ${budgetRange[0].toLocaleString()} - $
              {budgetRange[1].toLocaleString()}
            </div>
          </div>
          <div className="space-y-2">
            <Slider
              value={budgetRange}
              onValueChange={handleBudgetRangeChange}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$10,000+</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="budget_min" className="text-xs">
                Min Budget
              </Label>
              <Input
                id="budget_min"
                type="number"
                placeholder="Min"
                value={localFilters.budget_min || ''}
                onChange={e =>
                  handleFilterChange(
                    'budget_min',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="budget_max" className="text-xs">
                Max Budget
              </Label>
              <Input
                id="budget_max"
                type="number"
                placeholder="Max"
                value={localFilters.budget_max || ''}
                onChange={e =>
                  handleFilterChange(
                    'budget_max',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Quick Budget Filters */}
        <div className="space-y-2">
          <Label>Quick Budget Filters</Label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_RANGES.map(range => {
              const isSelected =
                localFilters.budget_min === range.min &&
                localFilters.budget_max === range.max;
              return (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isSelected) {
                      handleMultipleFilterChanges({
                        budget_min: undefined,
                        budget_max: undefined,
                      });
                      setBudgetRange([0, 10000]);
                    } else {
                      handleMultipleFilterChanges({
                        budget_min: range.min,
                        budget_max: range.max,
                      });
                      setBudgetRange([range.min, range.max ?? 10000]);
                    }
                  }}
                  className={`text-xs ${isSelected ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700' : ''}`}
                >
                  {range.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
