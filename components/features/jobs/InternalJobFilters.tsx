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
import {
  Search,
  Filter,
  X,
  Users,
  Briefcase,
  Building,
  Star,
  MapPin,
  DollarSign,
} from 'lucide-react';
import {
  INTERNAL_JOB_CATEGORIES,
  EXPERIENCE_LEVELS,
  WORK_ARRANGEMENTS,
  JOB_SERVICE_CATEGORIES,
} from '@/types/jobs';

interface InternalJobFiltersProps {
  onFiltersChange: (filters: InternalJobFilterState) => void;
  initialFilters?: InternalJobFilterState;
  className?: string;
}

export interface InternalJobFilterState {
  search: string;
  job_category: string[];
  service_category: string[];
  experience_level: string[];
  work_arrangement: string[];
  budget_min?: number;
  budget_max?: number;
  location: string;
  is_remote: boolean | null;
  skills: string[];
}

const defaultFilters: InternalJobFilterState = {
  search: '',
  job_category: [],
  service_category: [],
  experience_level: [],
  work_arrangement: [],
  location: '',
  is_remote: null,
  skills: [],
};

export function InternalJobFilters({
  onFiltersChange,
  initialFilters = defaultFilters,
  className = '',
}: InternalJobFiltersProps) {
  const [filters, setFilters] =
    useState<InternalJobFilterState>(initialFilters);
  const [skillInput, setSkillInput] = useState('');

  const updateFilters = (newFilters: Partial<InternalJobFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const toggleArrayFilter = (
    field: keyof InternalJobFilterState,
    value: string
  ) => {
    const currentArray = (filters[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters({ [field]: newArray });
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      updateFilters({
        skills: [...filters.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateFilters({
      skills: filters.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.job_category.length > 0) count++;
    if (filters.service_category.length > 0) count++;
    if (filters.experience_level.length > 0) count++;
    if (filters.work_arrangement.length > 0) count++;
    if (filters.budget_min || filters.budget_max) count++;
    if (filters.location) count++;
    if (filters.is_remote !== null) count++;
    if (filters.skills.length > 0) count++;
    return count;
  };

  const getJobCategoryIcon = (category: string) => {
    switch (category) {
      case 'casual_work':
        return <Users className="h-4 w-4" />;
      case 'subcontracting':
        return <Briefcase className="h-4 w-4" />;
      case 'partnerships':
        return <Building className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Internal Jobs
          </div>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
              placeholder="Search job titles, descriptions, or skills..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Job Categories */}
        <div className="space-y-2">
          <Label>Job Categories</Label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(INTERNAL_JOB_CATEGORIES).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${key}`}
                  checked={filters.job_category.includes(value)}
                  onCheckedChange={() =>
                    toggleArrayFilter('job_category', value)
                  }
                />
                <Label
                  htmlFor={`category-${key}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {getJobCategoryIcon(value)}
                  <span className="capitalize">{value.replace('_', ' ')}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Service Categories */}
        <div className="space-y-2">
          <Label>Service Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${key}`}
                  checked={filters.service_category.includes(value)}
                  onCheckedChange={() =>
                    toggleArrayFilter('service_category', value)
                  }
                />
                <Label
                  htmlFor={`service-${key}`}
                  className="text-sm cursor-pointer"
                >
                  {value.replace('_', ' ').toUpperCase()}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Levels */}
        <div className="space-y-2">
          <Label>Experience Levels</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(EXPERIENCE_LEVELS).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`experience-${key}`}
                  checked={filters.experience_level.includes(value)}
                  onCheckedChange={() =>
                    toggleArrayFilter('experience_level', value)
                  }
                />
                <Label
                  htmlFor={`experience-${key}`}
                  className="flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Star className="h-3 w-3" />
                  <span className="capitalize">{value}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Work Arrangements */}
        <div className="space-y-2">
          <Label>Work Arrangements</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(WORK_ARRANGEMENTS).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`work-${key}`}
                  checked={filters.work_arrangement.includes(value)}
                  onCheckedChange={() =>
                    toggleArrayFilter('work_arrangement', value)
                  }
                />
                <Label
                  htmlFor={`work-${key}`}
                  className="text-sm cursor-pointer"
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label>Required Skills</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                placeholder="Add a skill to filter by..."
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Add
              </Button>
            </div>
            {filters.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <Label>Budget Range (NZD)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="budget_min" className="text-xs">
                Min
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                <Input
                  id="budget_min"
                  type="number"
                  value={filters.budget_min || ''}
                  onChange={e =>
                    updateFilters({
                      budget_min: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0"
                  className="pl-6 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="budget_max" className="text-xs">
                Max
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                <Input
                  id="budget_max"
                  type="number"
                  value={filters.budget_max || ''}
                  onChange={e =>
                    updateFilters({
                      budget_max: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="10000"
                  className="pl-6 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              value={filters.location}
              onChange={e => updateFilters({ location: e.target.value })}
              placeholder="e.g., Auckland, Wellington"
              className="pl-10"
            />
          </div>
        </div>

        {/* Remote Work */}
        <div className="space-y-2">
          <Label>Remote Work</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote_yes"
                checked={filters.is_remote === true}
                onCheckedChange={checked =>
                  updateFilters({ is_remote: checked ? true : null })
                }
              />
              <Label htmlFor="remote_yes" className="cursor-pointer">
                Remote work available
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote_no"
                checked={filters.is_remote === false}
                onCheckedChange={checked =>
                  updateFilters({ is_remote: checked ? false : null })
                }
              />
              <Label htmlFor="remote_no" className="cursor-pointer">
                On-site only
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
