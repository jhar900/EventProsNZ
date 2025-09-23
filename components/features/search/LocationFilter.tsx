'use client';

import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface LocationFilterProps {
  value: string;
  radius?: number;
  onChange: (location: string, radius?: number) => void;
  isLoading?: boolean;
  className?: string;
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

export function LocationFilter({
  value,
  radius,
  onChange,
  isLoading = false,
  className = '',
}: LocationFilterProps) {
  const [localValue, setLocalValue] = useState(value);
  const [localRadius, setLocalRadius] = useState(radius || 25);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocalValue(newLocation);
    onChange(newLocation, localRadius);
  };

  const handleRadiusChange = (newRadius: number) => {
    setLocalRadius(newRadius);
    onChange(localValue, newRadius);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Location
      </label>

      <div className="relative">
        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Enter city, suburb, or address..."
          value={localValue}
          onChange={handleLocationChange}
          disabled={isLoading}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {localValue && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Search Radius
          </label>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRadiusChange(option.value)}
                disabled={isLoading}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  localRadius === option.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
