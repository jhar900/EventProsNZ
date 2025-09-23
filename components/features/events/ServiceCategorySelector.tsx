'use client';

import React from 'react';
import { SERVICE_CATEGORIES } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Utensils,
  Camera,
  Music,
  Flower2,
  Building,
  PartyPopper,
  Car,
  Headphones,
  Shield,
  Sparkles,
  Cake,
  HelpCircle,
} from 'lucide-react';

interface ServiceCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const serviceCategoryConfig = {
  [SERVICE_CATEGORIES.CATERING]: {
    label: 'Catering',
    icon: Utensils,
    description: 'Food and beverage services',
    color: 'text-orange-600',
  },
  [SERVICE_CATEGORIES.PHOTOGRAPHY]: {
    label: 'Photography',
    icon: Camera,
    description: 'Photography and videography',
    color: 'text-blue-600',
  },
  [SERVICE_CATEGORIES.MUSIC]: {
    label: 'Music',
    icon: Music,
    description: 'Musical entertainment and sound',
    color: 'text-purple-600',
  },
  [SERVICE_CATEGORIES.DECORATIONS]: {
    label: 'Decorations',
    icon: Flower2,
    description: 'Event decorations and styling',
    color: 'text-pink-600',
  },
  [SERVICE_CATEGORIES.VENUE]: {
    label: 'Venue',
    icon: Building,
    description: 'Event venues and spaces',
    color: 'text-gray-600',
  },
  [SERVICE_CATEGORIES.ENTERTAINMENT]: {
    label: 'Entertainment',
    icon: PartyPopper,
    description: 'Entertainment and activities',
    color: 'text-yellow-600',
  },
  [SERVICE_CATEGORIES.TRANSPORTATION]: {
    label: 'Transportation',
    icon: Car,
    description: 'Transport and logistics',
    color: 'text-green-600',
  },
  [SERVICE_CATEGORIES.AV_EQUIPMENT]: {
    label: 'AV Equipment',
    icon: Headphones,
    description: 'Audio-visual equipment',
    color: 'text-indigo-600',
  },
  [SERVICE_CATEGORIES.SECURITY]: {
    label: 'Security',
    icon: Shield,
    description: 'Security and safety services',
    color: 'text-red-600',
  },
  [SERVICE_CATEGORIES.CLEANING]: {
    label: 'Cleaning',
    icon: Sparkles,
    description: 'Cleaning and maintenance',
    color: 'text-cyan-600',
  },
  [SERVICE_CATEGORIES.FLOWERS]: {
    label: 'Flowers',
    icon: Flower2,
    description: 'Floral arrangements',
    color: 'text-rose-600',
  },
  [SERVICE_CATEGORIES.CAKE]: {
    label: 'Cake',
    icon: Cake,
    description: 'Cakes and desserts',
    color: 'text-amber-600',
  },
  [SERVICE_CATEGORIES.OTHER]: {
    label: 'Other',
    icon: HelpCircle,
    description: 'Other services',
    color: 'text-slate-600',
  },
};

export function ServiceCategorySelector({
  value,
  onChange,
}: ServiceCategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Object.entries(serviceCategoryConfig).map(([category, config]) => {
        const Icon = config.icon;
        const isSelected = value === category;

        return (
          <Card
            key={category}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-sm',
              isSelected && 'ring-2 ring-primary shadow-sm'
            )}
            onClick={() => onChange(category)}
          >
            <CardContent className="p-3">
              <div className="flex flex-col items-center space-y-2 text-center">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-primary' : config.color
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <h4
                    className={cn(
                      'font-medium text-xs',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {config.label}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {config.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
