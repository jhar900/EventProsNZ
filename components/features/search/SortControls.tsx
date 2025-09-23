'use client';

import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortControlsProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  isLoading?: boolean;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export function SortControls({
  sortBy,
  onSortChange,
  isLoading = false,
  className = '',
}: SortControlsProps) {
  const currentSort =
    SORT_OPTIONS.find(option => option.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-700">Sort by:</span>
      <div className="relative">
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          disabled={isLoading}
          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
