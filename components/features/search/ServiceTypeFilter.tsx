'use client';

import { Button } from '@/components/ui/button';

interface ServiceTypeFilterProps {
  value: string[];
  onChange: (serviceTypes: string[]) => void;
  options: string[];
  isLoading?: boolean;
  className?: string;
}

export function ServiceTypeFilter({
  value,
  onChange,
  options,
  isLoading = false,
  className = '',
}: ServiceTypeFilterProps) {
  const handleServiceTypeToggle = (serviceType: string) => {
    const isSelected = value.includes(serviceType);
    if (isSelected) {
      onChange(value.filter(type => type !== serviceType));
    } else {
      onChange([...value, serviceType]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Service Types
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(serviceType => (
          <Button
            key={serviceType}
            variant={value.includes(serviceType) ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleServiceTypeToggle(serviceType)}
            disabled={isLoading}
            className="text-xs"
          >
            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
          </Button>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} service type{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
