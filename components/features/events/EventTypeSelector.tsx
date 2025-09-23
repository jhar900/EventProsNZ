'use client';

import React from 'react';
import { EVENT_TYPES } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Heart,
  Building2,
  PartyPopper,
  Users,
  GraduationCap,
  Wrench,
  PresentationChart,
  Music,
  Calendar,
  Trophy,
  Gift,
  HelpCircle,
} from 'lucide-react';

interface EventTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const eventTypeConfig = {
  [EVENT_TYPES.WEDDING]: {
    label: 'Wedding',
    icon: Heart,
    description: 'Celebrate your special day',
    color: 'text-pink-600',
  },
  [EVENT_TYPES.CORPORATE]: {
    label: 'Corporate Event',
    icon: Building2,
    description: 'Business meetings and conferences',
    color: 'text-blue-600',
  },
  [EVENT_TYPES.PARTY]: {
    label: 'Party',
    icon: PartyPopper,
    description: 'Birthdays, celebrations, and social gatherings',
    color: 'text-purple-600',
  },
  [EVENT_TYPES.CONFERENCE]: {
    label: 'Conference',
    icon: Users,
    description: 'Professional conferences and seminars',
    color: 'text-indigo-600',
  },
  [EVENT_TYPES.SEMINAR]: {
    label: 'Seminar',
    icon: GraduationCap,
    description: 'Educational seminars and workshops',
    color: 'text-green-600',
  },
  [EVENT_TYPES.WORKSHOP]: {
    label: 'Workshop',
    icon: Wrench,
    description: 'Hands-on learning and training',
    color: 'text-orange-600',
  },
  [EVENT_TYPES.EXHIBITION]: {
    label: 'Exhibition',
    icon: PresentationChart,
    description: 'Trade shows and exhibitions',
    color: 'text-cyan-600',
  },
  [EVENT_TYPES.CONCERT]: {
    label: 'Concert',
    icon: Music,
    description: 'Musical performances and shows',
    color: 'text-red-600',
  },
  [EVENT_TYPES.FESTIVAL]: {
    label: 'Festival',
    icon: Calendar,
    description: 'Multi-day festivals and events',
    color: 'text-yellow-600',
  },
  [EVENT_TYPES.SPORTS]: {
    label: 'Sports Event',
    icon: Trophy,
    description: 'Sports competitions and tournaments',
    color: 'text-emerald-600',
  },
  [EVENT_TYPES.CHARITY]: {
    label: 'Charity Event',
    icon: Gift,
    description: 'Fundraising and charity events',
    color: 'text-rose-600',
  },
  [EVENT_TYPES.OTHER]: {
    label: 'Other',
    icon: HelpCircle,
    description: 'Custom event type',
    color: 'text-gray-600',
  },
};

export function EventTypeSelector({ value, onChange }: EventTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Object.entries(eventTypeConfig).map(([type, config]) => {
        const Icon = config.icon;
        const isSelected = value === type;

        return (
          <Card
            key={type}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              isSelected && 'ring-2 ring-primary shadow-md'
            )}
            onClick={() => onChange(type)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
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
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-medium text-sm',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {config.label}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
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
