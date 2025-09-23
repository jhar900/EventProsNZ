'use client';

import { Button } from '@/components/ui/button';

interface ResponseTimeFilterProps {
  value: string;
  onChange: (responseTime: string) => void;
  isLoading?: boolean;
  className?: string;
}

const RESPONSE_TIME_OPTIONS = [
  { value: '24h', label: 'Within 24 hours' },
  { value: '48h', label: 'Within 48 hours' },
  { value: '1week', label: 'Within 1 week' },
  { value: '2weeks', label: 'Within 2 weeks' },
];

export function ResponseTimeFilter({
  value,
  onChange,
  isLoading = false,
  className = '',
}: ResponseTimeFilterProps) {
  const handleResponseTimeSelect = (responseTime: string) => {
    if (value === responseTime) {
      onChange('');
    } else {
      onChange(responseTime);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Response Time
      </label>
      <div className="flex flex-wrap gap-2">
        {RESPONSE_TIME_OPTIONS.map(option => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleResponseTimeSelect(option.value)}
            disabled={isLoading}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-500">
          Showing contractors who respond{' '}
          {RESPONSE_TIME_OPTIONS.find(
            opt => opt.value === value
          )?.label.toLowerCase()}
        </p>
      )}
    </div>
  );
}
