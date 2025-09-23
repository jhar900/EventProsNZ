'use client';

import { Button } from '@/components/ui/button';

interface RatingFilterProps {
  value?: number;
  onChange: (ratingMin?: number) => void;
  ratingRanges: Array<{ label: string; min: number; max: number }>;
  isLoading?: boolean;
  className?: string;
}

export function RatingFilter({
  value,
  onChange,
  ratingRanges,
  isLoading = false,
  className = '',
}: RatingFilterProps) {
  const handleRatingSelect = (ratingMin: number) => {
    if (value === ratingMin) {
      onChange(undefined);
    } else {
      onChange(ratingMin);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Minimum Rating
      </label>
      <div className="flex flex-wrap gap-2">
        {ratingRanges.map(range => (
          <Button
            key={range.min}
            variant={value === range.min ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRatingSelect(range.min)}
            disabled={isLoading}
            className="text-xs flex items-center space-x-1"
          >
            <span>⭐</span>
            <span>{range.label}</span>
          </Button>
        ))}
      </div>
      {value !== undefined && (
        <p className="text-xs text-gray-500">
          Showing contractors with {value}+ star rating
        </p>
      )}
    </div>
  );
}
