'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react';
import {
  JOB_TYPES,
  JOB_SERVICE_CATEGORIES,
  RESPONSE_PREFERENCES,
} from '@/types/jobs';

// Form validation schema
const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long'),
  job_type: z.enum(['event_manager', 'contractor_internal']),
  service_category: z.string().min(1, 'Service category is required'),
  budget_range_min: z.number().min(0).optional(),
  budget_range_max: z.number().min(0).optional(),
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
  contact_email: z.string().email('Invalid email').optional(),
  contact_phone: z.string().max(50, 'Phone number too long').optional(),
  response_preferences: z.enum(['email', 'phone', 'platform']).optional(),
  timeline_start_date: z.string().optional(),
  timeline_end_date: z.string().optional(),
  event_id: z.string().uuid().optional(),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSuccess?: (job: any) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  eventData?: {
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    location: string;
    description?: string;
  };
}

export function JobForm({
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
  eventData,
}: JobFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEventData, setUseEventData] = useState(false);

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
      job_type: 'event_manager',
      service_category: 'catering',
      is_remote: false,
      ...initialData,
    },
  });

  const watchedJobType = watch('job_type');
  const watchedIsRemote = watch('is_remote');

  // Pre-populate form with event data if available
  useEffect(() => {
    if (eventData && useEventData) {
      setValue('title', `Event Manager for ${eventData.title}`);
      setValue('description', eventData.description || '');
      setValue('location', eventData.location);
      setValue('event_id', eventData.id);
    }
  }, [eventData, useEventData, setValue]);

  const onSubmit = async (data: JobFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/jobs', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save job');
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
    }
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Job Type */}
          <div className="space-y-2">
            <Label htmlFor="job_type">Job Type *</Label>
            <Select
              value={watchedJobType}
              onValueChange={value =>
                setValue(
                  'job_type',
                  value as 'event_manager' | 'contractor_internal'
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event_manager">
                  Event Manager Position
                </SelectItem>
                <SelectItem value="contractor_internal">
                  Internal Contractor Role
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.job_type && (
              <p className="text-sm text-red-600">{errors.job_type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Wedding Coordinator for 150-guest event"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
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

          {/* Budget Range */}
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

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                {...register('location')}
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
              <Label htmlFor="timeline_start_date">Start Date</Label>
              <Input
                id="timeline_start_date"
                type="date"
                {...register('timeline_start_date')}
              />
              {errors.timeline_start_date && (
                <p className="text-sm text-red-600">
                  {errors.timeline_start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline_end_date">End Date</Label>
              <Input
                id="timeline_end_date"
                type="date"
                {...register('timeline_end_date')}
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

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    placeholder="your@email.com"
                    className="pl-10"
                  />
                </div>
                {errors.contact_email && (
                  <p className="text-sm text-red-600">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_phone"
                    type="tel"
                    {...register('contact_phone')}
                    placeholder="+64 21 123 4567"
                    className="pl-10"
                  />
                </div>
                {errors.contact_phone && (
                  <p className="text-sm text-red-600">
                    {errors.contact_phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response_preferences">
                Preferred Response Method
              </Label>
              <Select
                onValueChange={value =>
                  setValue(
                    'response_preferences',
                    value as 'email' | 'phone' | 'platform'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred response method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="platform">Platform Messages</SelectItem>
                </SelectContent>
              </Select>
              {errors.response_preferences && (
                <p className="text-sm text-red-600">
                  {errors.response_preferences.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
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
