/**
 * Radius Selector Component
 * Component for selecting proximity search radius
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadiusOption {
  value: number;
  label: string;
}

export interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
  options: RadiusOption[];
  className?: string;
}

export function RadiusSelector({
  value,
  onChange,
  options,
  className,
}: RadiusSelectorProps) {
  return (
    <div className={className}>
      <RadioGroup
        value={value.toString()}
        onValueChange={value => onChange(parseInt(value, 10))}
        className="grid grid-cols-2 gap-2"
      >
        {options.map(option => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value.toString()}
              id={`radius-${option.value}`}
            />
            <Label
              htmlFor={`radius-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
