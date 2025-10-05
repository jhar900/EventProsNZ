'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Save, Eye, EyeOff } from 'lucide-react';
import { EventDetailsInput } from './EventDetailsInput';
import { ContractorSelection } from './ContractorSelection';
import {
  InquiryData,
  InquiryTemplate,
  INQUIRY_TYPES,
  INQUIRY_PRIORITY,
  EVENT_TYPES,
} from '@/types/inquiries';

// Form validation schema
const inquiryFormSchema = z.object({
  contractor_id: z.string().uuid('Please select a contractor'),
  event_id: z.string().uuid().optional(),
  inquiry_type: z.enum(Object.values(INQUIRY_TYPES) as [string, ...string[]]),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional(),
  event_details: z
    .object({
      event_type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      event_date: z.string(),
      duration_hours: z.number().min(0).max(168).optional(),
      attendee_count: z.number().min(1).max(10000).optional(),
      location: z.object({
        address: z.string(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
        placeId: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      }),
      budget_total: z.number().min(0).optional(),
      special_requirements: z.string().optional(),
      service_requirements: z
        .array(
          z.object({
            category: z.string(),
            type: z.string(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high']),
            estimated_budget: z.number().min(0).optional(),
            is_required: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

interface InquiryFormProps {
  contractorId?: string;
  eventId?: string;
  initialInquiry?: any;
  onSubmit: (data: InquiryFormData) => Promise<void>;
  isLoading?: boolean;
  templates?: InquiryTemplate[];
}

export function InquiryForm({
  contractorId,
  eventId,
  initialInquiry,
  onSubmit,
  isLoading = false,
  templates = [],
}: InquiryFormProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<InquiryTemplate | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      contractor_id: contractorId || '',
      event_id: eventId || '',
      inquiry_type: INQUIRY_TYPES.GENERAL,
      priority: INQUIRY_PRIORITY.MEDIUM,
      showEventDetails: false,
    },
  });

  // Watch form values
  const watchedValues = watch();

  // Apply template
  const applyTemplate = (template: InquiryTemplate) => {
    setSelectedTemplate(template);

    // Parse template content and apply to form
    try {
      const templateData = JSON.parse(template.template_content);

      if (templateData.subject) setValue('subject', templateData.subject);
      if (templateData.message) setValue('message', templateData.message);
      if (templateData.inquiry_type)
        setValue('inquiry_type', templateData.inquiry_type);
      if (templateData.priority) setValue('priority', templateData.priority);
      if (templateData.event_details) {
        setValue('event_details', templateData.event_details);
        setShowEventDetails(true);
      }
    } catch (error) {
      console.error('Failed to parse template:', error);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: InquiryFormData) => {
    try {
      await onSubmit(data);
      reset();
      setSelectedTemplate(null);
      setShowEventDetails(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Handle draft save
  const handleDraftSave = async () => {
    const formData = watchedValues;
    setIsDraft(true);

    try {
      await onSubmit({ ...formData, isDraft: true });
      setIsDraft(false);
    } catch (error) {
      console.error('Draft save error:', error);
      setIsDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Use Template</CardTitle>
            <CardDescription>
              Select a template to pre-fill the inquiry form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium">{template.template_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.template_type}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Used {template.usage_count} times
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Inquiry</CardTitle>
          <CardDescription>
            Send a structured inquiry to a contractor with event details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Contractor Selection */}
            <div className="space-y-2">
              <Label htmlFor="contractor_id">Contractor *</Label>
              <ContractorSelection
                value={watchedValues.contractor_id}
                onChange={contractorId =>
                  setValue('contractor_id', contractorId)
                }
                error={errors.contractor_id?.message}
              />
            </div>

            {/* Event Selection */}
            {eventId && (
              <div className="space-y-2">
                <Label htmlFor="event_id">Event</Label>
                <Input
                  id="event_id"
                  value={watchedValues.event_id}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-600">
                  Event details will be pre-populated from the selected event
                </p>
              </div>
            )}

            {/* Inquiry Type */}
            <div className="space-y-2">
              <Label htmlFor="inquiry_type">Inquiry Type *</Label>
              <Select
                value={watchedValues.inquiry_type || INQUIRY_TYPES.GENERAL}
                onValueChange={value => setValue('inquiry_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INQUIRY_TYPES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inquiry_type && (
                <p className="text-sm text-red-600">
                  {errors.inquiry_type.message}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watchedValues.priority || INQUIRY_PRIORITY.MEDIUM}
                onValueChange={value => setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INQUIRY_PRIORITY).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="Enter inquiry subject"
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Enter your inquiry message"
                rows={6}
                className={errors.message ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-600">
                {watchedValues.message?.length || 0}/2000 characters
              </p>
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            {/* Event Details Toggle */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showEventDetails"
                  checked={showEventDetails}
                  onCheckedChange={setShowEventDetails}
                />
                <Label htmlFor="showEventDetails">Include event details</Label>
              </div>
              {showEventDetails && (
                <EventDetailsInput
                  value={watchedValues.event_details}
                  onChange={eventDetails =>
                    setValue('event_details', eventDetails)
                  }
                  error={errors.event_details?.message}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDraftSave}
                  disabled={isSubmitting || isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={isSubmitting || isLoading}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting || isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Inquiry
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
