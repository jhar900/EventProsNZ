'use client';

import { Button } from '@/components/ui/button';

interface RegionFilterProps {
  value: string[];
  onChange: (regions: string[]) => void;
  options: string[];
  isLoading?: boolean;
  className?: string;
}

export function RegionFilter({
  value,
  onChange,
  options,
  isLoading = false,
  className = '',
}: RegionFilterProps) {
  const handleRegionToggle = (region: string) => {
    const isSelected = value.includes(region);
    if (isSelected) {
      onChange(value.filter(r => r !== region));
    } else {
      onChange([...value, region]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">Regions</label>
      <div className="flex flex-wrap gap-2">
        {options.map(region => (
          <Button
            key={region}
            variant={value.includes(region) ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRegionToggle(region)}
            disabled={isLoading}
            className="text-xs"
          >
            {region}
          </Button>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} region{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
