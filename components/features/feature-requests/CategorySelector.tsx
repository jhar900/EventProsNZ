'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { Search, Filter, X } from 'lucide-react';

interface FeatureRequestCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

interface CategorySelectorProps {
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string) => void;
  showFilter?: boolean;
  onFilterChange?: (searchTerm: string) => void;
  className?: string;
}

export default function CategorySelector({
  selectedCategoryId,
  onCategoryChange,
  showFilter = false,
  onFilterChange,
  className = '',
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<FeatureRequestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Load categories on mount
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
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const filteredCategories = showAll ? categories : categories.slice(0, 6);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onFilterChange) {
      onFilterChange('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Filter */}
      {showFilter && (
        <div className="space-y-2">
          <Label htmlFor="category-search">Search Categories</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="category-search"
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search categories..."
              className="pl-10"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div className="space-y-2">
        <Label>Select Category</Label>
        <Select
          value={selectedCategoryId || ''}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Or select from popular categories</Label>
          {categories.length > 6 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {filteredCategories.map(category => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategoryId === category.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected Category Display */}
      {selectedCategoryId && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Selected Category:
            </span>
          </div>
          <div className="mt-1">
            {(() => {
              const selectedCategory = categories.find(
                cat => cat.id === selectedCategoryId
              );
              return selectedCategory ? (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 w-fit"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  {selectedCategory.name}
                </Badge>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
