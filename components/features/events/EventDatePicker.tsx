'use client';

import React, { useState } from 'react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EventDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventDatePicker({ value, onChange }: EventDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [time, setTime] = useState(() => {
    if (value) {
      const date = new Date(value);
      return {
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
      };
    }
    return { hours: '18', minutes: '00' };
  });

  const minDate = new Date();
  const maxDate = addDays(new Date(), 365 * 2); // 2 years from now

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateDateTime(date, time.hours, time.minutes);
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    const newTime = { ...time, [field]: value };
    setTime(newTime);

    if (selectedDate) {
      updateDateTime(selectedDate, newTime.hours, newTime.minutes);
    }
  };

  const updateDateTime = (date: Date, hours: string, minutes: string) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Ensure the datetime is in the future
    if (isAfter(newDate, new Date())) {
      onChange(newDate.toISOString());
    }
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP');
    } catch {
      return '';
    }
  };

  const formatDisplayTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'p');
    } catch {
      return '';
    }
  };

  const generateHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return (
        <SelectItem key={hour} value={hour}>
          {hour}:00
        </SelectItem>
      );
    });
  };

  const generateMinuteOptions = () => {
    return ['00', '15', '30', '45'].map(minute => (
      <SelectItem key={minute} value={minute}>
        {minute}
      </SelectItem>
    ));
  };

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label>Event Date</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? formatDisplayDate(selectedDate.toISOString())
                : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={date =>
                isBefore(date, minDate) || isAfter(date, maxDate)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-2">
          <Label>Event Time</Label>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select
                value={time.hours}
                onValueChange={value => handleTimeChange('hours', value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{generateHourOptions()}</SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select
                value={time.minutes}
                onValueChange={value => handleTimeChange('minutes', value)}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{generateMinuteOptions()}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      {value && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Selected Date & Time:</p>
          <p className="text-sm text-muted-foreground">
            {formatDisplayDate(value)} at {formatDisplayTime(value)}
          </p>
        </div>
      )}

      {/* Quick Date Options */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick Select</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Today', days: 0 },
            { label: 'Tomorrow', days: 1 },
            { label: 'Next Week', days: 7 },
            { label: 'Next Month', days: 30 },
          ].map(({ label, days }) => {
            const date = addDays(new Date(), days);
            const isDisabled = isAfter(date, maxDate);

            return (
              <Button
                key={label}
                variant="outline"
                size="sm"
                disabled={isDisabled}
                onClick={() => {
                  setSelectedDate(date);
                  updateDateTime(date, time.hours, time.minutes);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
