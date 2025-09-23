'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BudgetFilterProps {
  priceMin?: number;
  priceMax?: number;
  onChange: (priceMin?: number, priceMax?: number) => void;
  priceRanges: Array<{ label: string; min: number; max: number | null }>;
  isLoading?: boolean;
  className?: string;
}

export function BudgetFilter({
  priceMin,
  priceMax,
  onChange,
  priceRanges,
  isLoading = false,
  className = '',
}: BudgetFilterProps) {
  const [localPriceMin, setLocalPriceMin] = useState(
    priceMin?.toString() || ''
  );
  const [localPriceMax, setLocalPriceMax] = useState(
    priceMax?.toString() || ''
  );

  const handlePriceRangeSelect = (range: {
    label: string;
    min: number;
    max: number | null;
  }) => {
    setLocalPriceMin(range.min.toString());
    setLocalPriceMax(range.max?.toString() || '');
    onChange(range.min, range.max || undefined);
  };

  const handleCustomPriceChange = () => {
    const min = localPriceMin ? parseFloat(localPriceMin) : undefined;
    const max = localPriceMax ? parseFloat(localPriceMax) : undefined;
    onChange(min, max);
  };

  const clearPrices = () => {
    setLocalPriceMin('');
    setLocalPriceMax('');
    onChange(undefined, undefined);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Budget Range
      </label>

      {/* Quick Price Range Buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Quick select:</p>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handlePriceRangeSelect(range)}
              disabled={isLoading}
              className="text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Price Range Inputs */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Custom range:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Min Price ($)
            </label>
            <input
              type="number"
              placeholder="0"
              value={localPriceMin}
              onChange={e => setLocalPriceMin(e.target.value)}
              onBlur={handleCustomPriceChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="10"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Max Price ($)
            </label>
            <input
              type="number"
              placeholder="No limit"
              value={localPriceMax}
              onChange={e => setLocalPriceMax(e.target.value)}
              onBlur={handleCustomPriceChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="10"
            />
          </div>
        </div>
      </div>

      {/* Clear Button */}
      {(priceMin !== undefined || priceMax !== undefined) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearPrices}
          disabled={isLoading}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          Clear price filter
        </Button>
      )}
    </div>
  );
}
