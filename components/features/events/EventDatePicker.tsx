'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react';
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

interface AdditionalDate {
  date: string; // ISO string for the date
  startTime?: string; // ISO string for start time
  endTime?: string; // ISO string for end time
}

interface EventDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  startTime?: string; // ISO string for start time
  endTime?: string; // ISO string for end time
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  additionalDates?: AdditionalDate[];
  onAdditionalDatesChange?: (dates: AdditionalDate[]) => void;
}

export function EventDatePicker({
  value,
  onChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  additionalDates = [],
  onAdditionalDatesChange,
}: EventDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [additionalDatePopovers, setAdditionalDatePopovers] = useState<{
    [key: number]: boolean;
  }>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  // Parse start time
  const [startTimeState, setStartTimeState] = useState(() => {
    if (startTime) {
      const date = new Date(startTime);
      return {
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
      };
    }
    // No default time - user must select
    return { hours: '', minutes: '' };
  });

  // Parse end time
  const [endTimeState, setEndTimeState] = useState(() => {
    if (endTime) {
      const date = new Date(endTime);
      return {
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
      };
    }
    // No default time - user must select
    return { hours: '', minutes: '' };
  });

  // Sync state when value prop changes (e.g., when loading event data or clearing)
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
    } else {
      // Clear everything when value is empty (new event creation)
      setSelectedDate(undefined);
    }
  }, [value]);

  // Sync start time when prop changes
  useEffect(() => {
    if (startTime) {
      const date = new Date(startTime);
      setStartTimeState({
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
      });
    } else {
      setStartTimeState({ hours: '', minutes: '' });
    }
  }, [startTime]);

  // Sync end time when prop changes
  useEffect(() => {
    if (endTime) {
      const date = new Date(endTime);
      setEndTimeState({
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
      });
    } else {
      setEndTimeState({ hours: '', minutes: '' });
    }
  }, [endTime]);

  const minDate = new Date();
  const maxDate = addDays(new Date(), 365 * 2); // 2 years from now

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (
      date &&
      onStartTimeChange &&
      startTimeState.hours &&
      startTimeState.minutes
    ) {
      // Update the main event date with start time
      const newDate = new Date(date);
      newDate.setHours(
        parseInt(startTimeState.hours),
        parseInt(startTimeState.minutes),
        0,
        0
      );
      if (isAfter(newDate, new Date())) {
        onChange(newDate.toISOString());
      }
    } else if (date) {
      // Just update the date without time
      onChange(date.toISOString());
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

  const handleStartTimeChange = (field: 'hours' | 'minutes', value: string) => {
    const newTime = { ...startTimeState, [field]: value };
    setStartTimeState(newTime);

    if (selectedDate && onStartTimeChange && newTime.hours && newTime.minutes) {
      const newDate = new Date(selectedDate);
      newDate.setHours(
        parseInt(newTime.hours),
        parseInt(newTime.minutes),
        0,
        0
      );
      onStartTimeChange(newDate.toISOString());

      // Also update the main event date
      if (isAfter(newDate, new Date())) {
        onChange(newDate.toISOString());
      }
    }
  };

  const handleEndTimeChange = (field: 'hours' | 'minutes', value: string) => {
    const newTime = { ...endTimeState, [field]: value };
    setEndTimeState(newTime);

    if (selectedDate && onEndTimeChange && newTime.hours && newTime.minutes) {
      const newDate = new Date(selectedDate);
      newDate.setHours(
        parseInt(newTime.hours),
        parseInt(newTime.minutes),
        0,
        0
      );
      onEndTimeChange(newDate.toISOString());
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

  const handleAddAdditionalDate = () => {
    if (onAdditionalDatesChange) {
      onAdditionalDatesChange([...additionalDates, { date: '' }]);
    }
  };

  const handleRemoveAdditionalDate = (index: number) => {
    if (onAdditionalDatesChange) {
      const newDates = additionalDates.filter((_, i) => i !== index);
      onAdditionalDatesChange(newDates);
      // Close popover if it was open
      const newPopovers = { ...additionalDatePopovers };
      delete newPopovers[index];
      setAdditionalDatePopovers(newPopovers);
    }
  };

  const handleAdditionalDateSelect = (
    index: number,
    date: Date | undefined
  ) => {
    if (onAdditionalDatesChange) {
      const newDates = [...additionalDates];
      if (date) {
        // Preserve existing times or use main event start/end times
        const existingDate = newDates[index];
        newDates[index] = {
          date: date.toISOString(),
          startTime: existingDate?.startTime || startTime,
          endTime: existingDate?.endTime || endTime,
        };
      } else {
        newDates[index] = { date: '' };
      }
      onAdditionalDatesChange(newDates);
    }
  };

  const handleAdditionalStartTimeChange = (
    index: number,
    field: 'hours' | 'minutes',
    value: string
  ) => {
    if (onAdditionalDatesChange) {
      const newDates = [...additionalDates];
      const existingDate = newDates[index];
      if (!existingDate || !existingDate.date) return;

      const date = new Date(existingDate.date);
      const currentTime = existingDate.startTime
        ? new Date(existingDate.startTime)
        : new Date(date);

      const newTime = {
        hours:
          field === 'hours'
            ? value
            : currentTime.getHours().toString().padStart(2, '0'),
        minutes:
          field === 'minutes'
            ? value
            : currentTime.getMinutes().toString().padStart(2, '0'),
      };

      if (newTime.hours && newTime.minutes) {
        date.setHours(parseInt(newTime.hours), parseInt(newTime.minutes), 0, 0);
        newDates[index] = {
          ...existingDate,
          startTime: date.toISOString(),
        };
        onAdditionalDatesChange(newDates);
      }
    }
  };

  const handleAdditionalEndTimeChange = (
    index: number,
    field: 'hours' | 'minutes',
    value: string
  ) => {
    if (onAdditionalDatesChange) {
      const newDates = [...additionalDates];
      const existingDate = newDates[index];
      if (!existingDate || !existingDate.date) return;

      const date = new Date(existingDate.date);
      const currentTime = existingDate.endTime
        ? new Date(existingDate.endTime)
        : new Date(date);

      const newTime = {
        hours:
          field === 'hours'
            ? value
            : currentTime.getHours().toString().padStart(2, '0'),
        minutes:
          field === 'minutes'
            ? value
            : currentTime.getMinutes().toString().padStart(2, '0'),
      };

      if (newTime.hours && newTime.minutes) {
        date.setHours(parseInt(newTime.hours), parseInt(newTime.minutes), 0, 0);
        newDates[index] = {
          ...existingDate,
          endTime: date.toISOString(),
        };
        onAdditionalDatesChange(newDates);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Date Selection */}
        <div className="flex-1">
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
          <div className="flex items-center gap-4">
            {/* Start Time */}
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start:</span>
              <Select
                value={startTimeState.hours || undefined}
                onValueChange={value => handleStartTimeChange('hours', value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>{generateHourOptions()}</SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select
                value={startTimeState.minutes || undefined}
                onValueChange={value => handleStartTimeChange('minutes', value)}
              >
                <SelectTrigger className="w-16">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>{generateMinuteOptions()}</SelectContent>
              </Select>
            </div>

            {/* End Time */}
            {onEndTimeChange && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">End:</span>
                <Select
                  value={endTimeState.hours || undefined}
                  onValueChange={value => handleEndTimeChange('hours', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>{generateHourOptions()}</SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select
                  value={endTimeState.minutes || undefined}
                  onValueChange={value => handleEndTimeChange('minutes', value)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>{generateMinuteOptions()}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Dates */}
      {onAdditionalDatesChange && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Additional Days (Optional)
          </Label>
          <div className="space-y-4">
            {additionalDates.map((additionalDate, index) => {
              const date =
                additionalDate?.date && additionalDate.date.trim()
                  ? new Date(additionalDate.date)
                  : undefined;
              const isOpen = additionalDatePopovers[index] || false;

              // Parse start time for this additional date
              const additionalStartTime = additionalDate?.startTime
                ? new Date(additionalDate.startTime)
                : undefined;
              const additionalStartTimeState = {
                hours: additionalStartTime
                  ? additionalStartTime.getHours().toString().padStart(2, '0')
                  : '',
                minutes: additionalStartTime
                  ? additionalStartTime.getMinutes().toString().padStart(2, '0')
                  : '',
              };

              // Parse end time for this additional date
              const additionalEndTime = additionalDate?.endTime
                ? new Date(additionalDate.endTime)
                : undefined;
              const additionalEndTimeState = {
                hours: additionalEndTime
                  ? additionalEndTime.getHours().toString().padStart(2, '0')
                  : '',
                minutes: additionalEndTime
                  ? additionalEndTime.getMinutes().toString().padStart(2, '0')
                  : '',
              };

              return (
                <div key={index} className="flex items-center gap-4">
                  {/* Date Selection */}
                  <div className="flex-1">
                    <Popover
                      open={isOpen}
                      onOpenChange={open =>
                        setAdditionalDatePopovers({
                          ...additionalDatePopovers,
                          [index]: open,
                        })
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date
                            ? formatDisplayDate(date.toISOString())
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={selectedDate =>
                            handleAdditionalDateSelect(index, selectedDate)
                          }
                          disabled={date =>
                            isBefore(date, minDate) || isAfter(date, maxDate)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Start and End Time for Additional Date */}
                  {date && (
                    <>
                      {/* Start Time */}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Start:
                        </span>
                        <Select
                          value={additionalStartTimeState.hours || undefined}
                          onValueChange={value =>
                            handleAdditionalStartTimeChange(
                              index,
                              'hours',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="HH" />
                          </SelectTrigger>
                          <SelectContent>{generateHourOptions()}</SelectContent>
                        </Select>
                        <span className="text-muted-foreground">:</span>
                        <Select
                          value={additionalStartTimeState.minutes || undefined}
                          onValueChange={value =>
                            handleAdditionalStartTimeChange(
                              index,
                              'minutes',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateMinuteOptions()}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* End Time */}
                      {onEndTimeChange && (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">
                            End:
                          </span>
                          <Select
                            value={additionalEndTimeState.hours || undefined}
                            onValueChange={value =>
                              handleAdditionalEndTimeChange(
                                index,
                                'hours',
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateHourOptions()}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground">:</span>
                          <Select
                            value={additionalEndTimeState.minutes || undefined}
                            onValueChange={value =>
                              handleAdditionalEndTimeChange(
                                index,
                                'minutes',
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateMinuteOptions()}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAdditionalDate(index)}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAdditionalDate}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Day
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
