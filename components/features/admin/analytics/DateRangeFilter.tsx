'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface PresetRange {
  label: string;
  value: string;
  days: number;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  onPresetChange: (preset: string) => void;
  selectedRange?: DateRange;
  selectedPreset?: string;
  className?: string;
}

const PRESET_RANGES: PresetRange[] = [
  { label: 'Last 24 Hours', value: '24h', days: 1 },
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'Last 3 Months', value: '3m', days: 90 },
  { label: 'Last 6 Months', value: '6m', days: 180 },
  { label: 'Last Year', value: '1y', days: 365 },
  { label: 'Year to Date', value: 'ytd', days: 0 },
  { label: 'All Time', value: 'all', days: 0 },
];

export default function DateRangeFilter({
  onDateRangeChange,
  onPresetChange,
  selectedRange,
  selectedPreset = '30d',
  className,
}: DateRangeFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [savedRanges, setSavedRanges] = useState<
    Array<{ name: string; range: DateRange }>
  >([]);

  useEffect(() => {
    // Load saved ranges from localStorage
    const saved = localStorage.getItem('analytics-saved-ranges');
    if (saved) {
      try {
        setSavedRanges(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved ranges:', error);
      }
    }
  }, []);

  const handlePresetChange = (preset: string) => {
    onPresetChange(preset);

    if (preset === 'custom') {
      setIsCustomOpen(true);
      return;
    }

    const presetRange = PRESET_RANGES.find(p => p.value === preset);
    if (presetRange) {
      const now = new Date();
      let from: Date;
      const to: Date = now;

      if (preset === 'ytd') {
        from = new Date(now.getFullYear(), 0, 1);
      } else if (preset === 'all') {
        from = new Date('2020-01-01'); // Adjust based on your data start date
      } else {
        from = new Date(now.getTime() - presetRange.days * 24 * 60 * 60 * 1000);
      }

      onDateRangeChange({ from, to });
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setCustomRange(range);
    }
  };

  const applyCustomRange = () => {
    if (customRange) {
      onDateRangeChange(customRange);
      setIsCustomOpen(false);
    }
  };

  const saveCurrentRange = () => {
    if (selectedRange) {
      const name = prompt('Enter a name for this date range:');
      if (name) {
        const newSavedRange = { name, range: selectedRange };
        const updatedSavedRanges = [...savedRanges, newSavedRange];
        setSavedRanges(updatedSavedRanges);
        localStorage.setItem(
          'analytics-saved-ranges',
          JSON.stringify(updatedSavedRanges)
        );
      }
    }
  };

  const loadSavedRange = (savedRange: { name: string; range: DateRange }) => {
    onDateRangeChange(savedRange.range);
    setIsCustomOpen(false);
  };

  const deleteSavedRange = (index: number) => {
    const updatedSavedRanges = savedRanges.filter((_, i) => i !== index);
    setSavedRanges(updatedSavedRanges);
    localStorage.setItem(
      'analytics-saved-ranges',
      JSON.stringify(updatedSavedRanges)
    );
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Ranges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
          <CardDescription>
            Select a preset range or choose custom dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Selection */}
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {PRESET_RANGES.map(preset => (
              <Button
                key={preset.value}
                variant={
                  selectedPreset === preset.value ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handlePresetChange(preset.value)}
                className="justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                {preset.label}
              </Button>
            ))}

            <Button
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('custom')}
              className="justify-start"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Custom Range
            </Button>
          </div>

          {/* Custom Date Range Picker */}
          <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedRange
                  ? formatDateRange(selectedRange)
                  : 'Pick a date range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Select Date Range</h4>
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={handleCustomRangeSelect}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={applyCustomRange} size="sm">
                    Apply Range
                  </Button>
                  <Button
                    onClick={() => setIsCustomOpen(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Current Selection Display */}
          {selectedRange && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatDateRange(selectedRange)}
                </span>
                <Badge variant="outline">
                  {Math.ceil(
                    (selectedRange.to.getTime() -
                      selectedRange.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </Badge>
              </div>
              <Button onClick={saveCurrentRange} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Ranges */}
      {savedRanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Ranges</CardTitle>
            <CardDescription>Your previously saved date ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedRanges.map((savedRange, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{savedRange.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateRange(savedRange.range)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => loadSavedRange(savedRange)}
                      variant="outline"
                      size="sm"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => deleteSavedRange(index)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common date range shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                onDateRangeChange({ from: startOfWeek, to: now });
              }}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfMonth = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1
                );
                onDateRangeChange({ from: startOfMonth, to: now });
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfQuarter = new Date(
                  now.getFullYear(),
                  Math.floor(now.getMonth() / 3) * 3,
                  1
                );
                onDateRangeChange({ from: startOfQuarter, to: now });
              }}
            >
              This Quarter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                onDateRangeChange({ from: startOfYear, to: now });
              }}
            >
              This Year
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
