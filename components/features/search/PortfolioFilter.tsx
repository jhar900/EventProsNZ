'use client';

import { Button } from '@/components/ui/button';

interface PortfolioFilterProps {
  value?: boolean;
  onChange: (hasPortfolio?: boolean) => void;
  isLoading?: boolean;
  className?: string;
}

const PORTFOLIO_OPTIONS = [
  { value: true, label: 'Has Portfolio' },
  { value: false, label: 'No Portfolio' },
];

export function PortfolioFilter({
  value,
  onChange,
  isLoading = false,
  className = '',
}: PortfolioFilterProps) {
  const handlePortfolioSelect = (hasPortfolio: boolean) => {
    if (value === hasPortfolio) {
      onChange(undefined);
    } else {
      onChange(hasPortfolio);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Portfolio
      </label>
      <div className="flex flex-wrap gap-2">
        {PORTFOLIO_OPTIONS.map(option => (
          <Button
            key={option.value.toString()}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePortfolioSelect(option.value)}
            disabled={isLoading}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {value !== undefined && (
        <p className="text-xs text-gray-500">
          Showing contractors {value ? 'with' : 'without'} portfolio
        </p>
      )}
    </div>
  );
}
