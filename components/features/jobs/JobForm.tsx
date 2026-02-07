'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { ContactPersonSelector, ContactPerson } from './ContactPersonSelector';
import {
  JOB_TYPES,
  JOB_SERVICE_CATEGORIES,
  RESPONSE_PREFERENCES,
  BUDGET_TYPES,
  BudgetType,
} from '@/types/jobs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Helper to convert NaN to undefined for optional number fields
const optionalNumber = z.preprocess(
  val =>
    val === '' || val === undefined || val === null || Number.isNaN(val)
      ? undefined
      : val,
  z.number().min(0).optional()
);

// Form validation schema
const jobFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(5000, 'Description too long'),
    service_category: z.string().min(1, 'Service category is required'),
    budget_type: z
      .enum(['range', 'fixed', 'open', 'hourly', 'daily'])
      .default('range'),
    budget_range_min: optionalNumber,
    budget_range_max: optionalNumber,
    budget_fixed: optionalNumber,
    hourly_rate: optionalNumber,
    daily_rate: optionalNumber,
    location: z
      .string()
      .min(1, 'Location is required')
      .max(200, 'Location too long'),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    is_remote: z.boolean().default(false),
    special_requirements: z
      .string()
      .max(2000, 'Special requirements too long')
      .optional(),
    contact_email: z.preprocess(
      val => (val === '' ? undefined : val),
      z.string().email('Invalid email').optional()
    ),
    contact_phone: z.string().max(50, 'Phone number too long').optional(),
    contact_person_id: z.string().uuid().optional(),
    response_preferences: z.enum(['email', 'phone', 'platform']).optional(),
    timeline_start_date: z.string().optional(),
    timeline_end_date: z.string().optional(),
    event_id: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(''))
      .transform(val => (val === '' ? undefined : val)),
  })
  .refine(
    data => {
      // If both dates are provided, start date must be before or equal to end date
      if (data.timeline_start_date && data.timeline_end_date) {
        const startDate = new Date(data.timeline_start_date);
        const endDate = new Date(data.timeline_end_date);
        return startDate <= endDate;
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['timeline_end_date'],
    }
  )
  .refine(
    data => {
      // Only validate budget range if budget_type is 'range' and both values are provided
      if (
        data.budget_type === 'range' &&
        data.budget_range_min !== undefined &&
        data.budget_range_max !== undefined
      ) {
        return data.budget_range_min <= data.budget_range_max;
      }
      return true;
    },
    {
      message: 'Minimum budget must be less than or equal to maximum budget',
      path: ['budget_range_max'],
    }
  );

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSuccess?: (job: any) => void;
  onCancel?: () => void;
  onContactPersonChange?: (contactPerson: ContactPerson | null) => void;
  isEditing?: boolean;
  jobId?: string;
  eventData?: {
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    end_date?: string;
    location: string;
    description?: string;
  };
}

export function JobForm({
  initialData,
  onSuccess,
  onCancel,
  onContactPersonChange,
  isEditing = false,
  jobId,
  eventData,
}: JobFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEventData, setUseEventData] = useState(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(
    new Set()
  );
  const [selectedContactPerson, setSelectedContactPerson] =
    useState<ContactPerson | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      service_category: 'catering',
      is_remote: false,
      budget_type: 'range',
      ...initialData,
    },
  });

  const watchedIsRemote = watch('is_remote');
  const watchedBudgetType = watch('budget_type');

  // Always link to event when eventData is provided (regardless of useEventData checkbox)
  useEffect(() => {
    if (eventData) {
      setValue('event_id', eventData.id);
    } else {
      setValue('event_id', undefined);
    }
  }, [eventData, setValue]);

  // Pre-populate form fields with event data when checkbox is checked
  useEffect(() => {
    if (eventData && useEventData) {
      const fieldsToPopulate = new Set<string>();

      setValue('title', `Event Manager for ${eventData.title}`);
      fieldsToPopulate.add('title');

      if (eventData.description) {
        setValue('description', eventData.description);
        fieldsToPopulate.add('description');
      }

      setValue('location', eventData.location);
      fieldsToPopulate.add('location');

      // Auto-populate timeline dates from event
      if (eventData.event_date) {
        const startDate = eventData.event_date.split('T')[0];
        setValue('timeline_start_date', startDate);
        fieldsToPopulate.add('timeline_start_date');
      }
      if (eventData.end_date) {
        const endDate = eventData.end_date.split('T')[0];
        setValue('timeline_end_date', endDate);
        fieldsToPopulate.add('timeline_end_date');
      }

      setAutoPopulatedFields(fieldsToPopulate);
    } else if (!useEventData) {
      setAutoPopulatedFields(new Set());
    }
  }, [eventData, useEventData, setValue]);

  const onSubmit = async (data: JobFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Include user ID in header as fallback if cookies fail
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      // Log the data being sent for debugging
      console.log('Submitting job data:', JSON.stringify(data, null, 2));

      const url = isEditing && jobId ? `/api/jobs/${jobId}` : '/api/jobs';
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        // Include more details in the error message
        const errorMessage =
          result.error || result.message || 'Failed to save job';
        const errorDetails = result.errors
          ? `: ${result.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`
          : '';
        throw new Error(errorMessage + errorDetails);
      }

      onSuccess?.(result.job);
    } catch (error) {
      console.error('Job form submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseEventData = (checked: boolean) => {
    setUseEventData(checked);
    if (!checked) {
      // Reset form to initial data when unchecking
      reset(initialData);
      setAutoPopulatedFields(new Set());
    }
  };

  // Clear auto-populated status when user manually edits a field
  const handleFieldChange = (fieldName: string) => {
    if (autoPopulatedFields.has(fieldName)) {
      setAutoPopulatedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  // Helper to render "From event" badge
  const renderFromEventBadge = (fieldName: string) => {
    if (autoPopulatedFields.has(fieldName)) {
      return (
        <Badge
          variant="secondary"
          className="ml-2 text-xs bg-blue-100 text-blue-700"
        >
          From event
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isEditing ? 'Edit Job Posting' : 'Create Job Posting'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit, validationErrors => {
            console.error('Form validation errors:', validationErrors);
            const errorFields = Object.keys(validationErrors).join(', ');
            setError(`Please fix the following fields: ${errorFields}`);
          })}
          className="space-y-6"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Event Data Integration */}
          {eventData && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-event-data"
                  checked={useEventData}
                  onCheckedChange={handleUseEventData}
                />
                <Label htmlFor="use-event-data" className="text-sm font-medium">
                  Use details from &quot;{eventData.title}&quot; event
                </Label>
              </div>
              {useEventData && (
                <div className="text-sm text-gray-600">
                  <p>Event Type: {eventData.event_type}</p>
                  <p>
                    Event Date:{' '}
                    {new Date(eventData.event_date).toLocaleDateString()}
                  </p>
                  <p>Location: {eventData.location}</p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="title">Job Title *</Label>
              {renderFromEventBadge('title')}
            </div>
            <Input
              id="title"
              {...register('title', {
                onChange: () => handleFieldChange('title'),
              })}
              placeholder="e.g., Wedding Coordinator for 150-guest event"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="description">Job Description *</Label>
              {renderFromEventBadge('description')}
            </div>
            <Textarea
              id="description"
              {...register('description', {
                onChange: () => handleFieldChange('description'),
              })}
              placeholder="Provide detailed information about the job, requirements, and expectations..."
              rows={6}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Service Category */}
          <div className="space-y-2">
            <Label htmlFor="service_category">Service Category *</Label>
            <Select
              value={watch('service_category')}
              onValueChange={value => setValue('service_category', value)}
            >
              <SelectTrigger id="service_category">
                <SelectValue placeholder="Select service category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value
                      .replace('_', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_category && (
              <p className="text-sm text-red-600">
                {errors.service_category.message}
              </p>
            )}
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <Label>Budget Type</Label>
            <RadioGroup
              value={watchedBudgetType || 'range'}
              onValueChange={value =>
                setValue('budget_type', value as BudgetType)
              }
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="budget-range" />
                <Label
                  htmlFor="budget-range"
                  className="font-normal cursor-pointer"
                >
                  Budget Range
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="budget-fixed" />
                <Label
                  htmlFor="budget-fixed"
                  className="font-normal cursor-pointer"
                >
                  Fixed Budget
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="budget-open" />
                <Label
                  htmlFor="budget-open"
                  className="font-normal cursor-pointer"
                >
                  Open to Offers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="budget-hourly" />
                <Label
                  htmlFor="budget-hourly"
                  className="font-normal cursor-pointer"
                >
                  Hourly Rate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="budget-daily" />
                <Label
                  htmlFor="budget-daily"
                  className="font-normal cursor-pointer"
                >
                  Daily Rate
                </Label>
              </div>
            </RadioGroup>

            {/* Budget Range Fields */}
            {watchedBudgetType === 'range' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_range_min">Minimum Budget (NZD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budget_range_min"
                      type="number"
                      {...register('budget_range_min', { valueAsNumber: true })}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                  {errors.budget_range_min && (
                    <p className="text-sm text-red-600">
                      {errors.budget_range_min.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_range_max">Maximum Budget (NZD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budget_range_max"
                      type="number"
                      {...register('budget_range_max', { valueAsNumber: true })}
                      placeholder="10000"
                      className="pl-10"
                    />
                  </div>
                  {errors.budget_range_max && (
                    <p className="text-sm text-red-600">
                      {errors.budget_range_max.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fixed Budget Field */}
            {watchedBudgetType === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="budget_fixed">Fixed Budget (NZD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="budget_fixed"
                    type="number"
                    {...register('budget_fixed', { valueAsNumber: true })}
                    placeholder="5000"
                    className="pl-10"
                  />
                </div>
                {errors.budget_fixed && (
                  <p className="text-sm text-red-600">
                    {errors.budget_fixed.message}
                  </p>
                )}
              </div>
            )}

            {/* Open to Offers - No input needed */}
            {watchedBudgetType === 'open' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Contractors will be able to propose their own pricing when
                  applying for this job.
                </p>
              </div>
            )}

            {/* Hourly Rate Field */}
            {watchedBudgetType === 'hourly' && (
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (NZD/hour)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="hourly_rate"
                    type="number"
                    {...register('hourly_rate', { valueAsNumber: true })}
                    placeholder="50"
                    className="pl-10"
                  />
                </div>
                {errors.hourly_rate && (
                  <p className="text-sm text-red-600">
                    {errors.hourly_rate.message}
                  </p>
                )}
              </div>
            )}

            {/* Daily Rate Field */}
            {watchedBudgetType === 'daily' && (
              <div className="space-y-2">
                <Label htmlFor="daily_rate">Daily Rate (NZD/day)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="daily_rate"
                    type="number"
                    {...register('daily_rate', { valueAsNumber: true })}
                    placeholder="400"
                    className="pl-10"
                  />
                </div>
                {errors.daily_rate && (
                  <p className="text-sm text-red-600">
                    {errors.daily_rate.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="location">Location *</Label>
              {renderFromEventBadge('location')}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                {...register('location', {
                  onChange: () => handleFieldChange('location'),
                })}
                placeholder="e.g., Auckland, New Zealand"
                className="pl-10"
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Remote Work Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_remote"
              checked={watchedIsRemote}
              onCheckedChange={checked =>
                setValue('is_remote', checked as boolean)
              }
            />
            <Label htmlFor="is_remote">This job can be done remotely</Label>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="timeline_start_date">Start Date</Label>
                {renderFromEventBadge('timeline_start_date')}
              </div>
              <Input
                id="timeline_start_date"
                type="date"
                {...register('timeline_start_date', {
                  onChange: () => handleFieldChange('timeline_start_date'),
                })}
              />
              {errors.timeline_start_date && (
                <p className="text-sm text-red-600">
                  {errors.timeline_start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="timeline_end_date">End Date</Label>
                {renderFromEventBadge('timeline_end_date')}
              </div>
              <Input
                id="timeline_end_date"
                type="date"
                {...register('timeline_end_date', {
                  onChange: () => handleFieldChange('timeline_end_date'),
                })}
              />
              {errors.timeline_end_date && (
                <p className="text-sm text-red-600">
                  {errors.timeline_end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="space-y-2">
            <Label htmlFor="special_requirements">Special Requirements</Label>
            <Textarea
              id="special_requirements"
              {...register('special_requirements')}
              placeholder="Any special requirements, constraints, or additional information..."
              rows={3}
            />
            {errors.special_requirements && (
              <p className="text-sm text-red-600">
                {errors.special_requirements.message}
              </p>
            )}
          </div>

          {/* Contact Person */}
          {user?.id && (
            <ContactPersonSelector
              userId={user.id}
              userProfile={user.profile}
              userEmail={user.email}
              selectedEventId={eventData?.id}
              selectedContactPersonId={selectedContactPerson?.id || user.id}
              onSelect={person => {
                setSelectedContactPerson(person);
                onContactPersonChange?.(person);
                if (person) {
                  setValue('contact_person_id', person.id);
                  setValue('contact_email', person.email);
                  setValue('contact_phone', person.phone || '');
                }
              }}
            />
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            {error && (
              <p className="text-sm text-red-600 max-w-md text-right flex-1">
                {error}
              </p>
            )}
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
