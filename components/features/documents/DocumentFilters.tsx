'use client';

import React from 'react';
import { DocumentFilters } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onFilterChange: (filters: DocumentFilters) => void;
}

export function DocumentFilters({
  filters,
  onFilterChange,
}: DocumentFiltersProps) {
  const categories = [
    'Contracts',
    'Event Planning',
    'Invoices',
    'Photos',
    'Presentations',
    'Reports',
    'Templates',
    'Other',
  ];

  const fileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      document_category: category === 'all' ? undefined : category,
    });
  };

  const handleFileTypeChange = (fileType: string) => {
    onFilterChange({
      ...filters,
      file_type: fileType === 'all' ? undefined : fileType,
    });
  };

  const handlePublicChange = (isPublic: boolean) => {
    onFilterChange({
      ...filters,
      is_public: isPublic ? true : undefined,
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...filters.date_range,
      [field]: value,
    };

    onFilterChange({
      ...filters,
      date_range:
        newDateRange.start && newDateRange.end ? newDateRange : undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof DocumentFilters];
    return value !== undefined && value !== null && value !== '';
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Filter documents by category, type, and date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div>
          <Label htmlFor="category-filter" className="text-xs font-medium">
            Category
          </Label>
          <Select
            value={filters.document_category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Type Filter */}
        <div>
          <Label htmlFor="file-type-filter" className="text-xs font-medium">
            File Type
          </Label>
          <Select
            value={filters.file_type || 'all'}
            onValueChange={handleFileTypeChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All file types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              <SelectItem value="application/pdf">PDF</SelectItem>
              <SelectItem value="application/msword">Word Document</SelectItem>
              <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                Word Document (DOCX)
              </SelectItem>
              <SelectItem value="application/vnd.ms-excel">
                Excel Spreadsheet
              </SelectItem>
              <SelectItem value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                Excel Spreadsheet (XLSX)
              </SelectItem>
              <SelectItem value="application/vnd.ms-powerpoint">
                PowerPoint Presentation
              </SelectItem>
              <SelectItem value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
                PowerPoint Presentation (PPTX)
              </SelectItem>
              <SelectItem value="text/plain">Text File</SelectItem>
              <SelectItem value="image/jpeg">JPEG Image</SelectItem>
              <SelectItem value="image/png">PNG Image</SelectItem>
              <SelectItem value="image/gif">GIF Image</SelectItem>
              <SelectItem value="image/webp">WebP Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Public Documents Filter */}
        <div className="flex items-center space-x-2">
          <Switch
            id="public-filter"
            checked={filters.is_public === true}
            onCheckedChange={handlePublicChange}
          />
          <Label htmlFor="public-filter" className="text-xs">
            Public documents only
          </Label>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-date" className="text-xs">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={filters.date_range?.start || ''}
                onChange={e => handleDateRangeChange('start', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={filters.date_range?.end || ''}
                onChange={e => handleDateRangeChange('end', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.document_category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {filters.document_category}
                </span>
              )}
              {filters.file_type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {filters.file_type.split('/')[1]}
                </span>
              )}
              {filters.is_public && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Public
                </span>
              )}
              {filters.date_range && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  Date range
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
