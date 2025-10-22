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
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Users,
  Briefcase,
  Star,
  Building,
} from 'lucide-react';
import {
  INTERNAL_JOB_CATEGORIES,
  EXPERIENCE_LEVELS,
  WORK_ARRANGEMENTS,
  JOB_SERVICE_CATEGORIES,
  RESPONSE_PREFERENCES,
} from '@/types/jobs';

// Form validation schema for internal jobs
const internalJobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long'),
  internal_job_category: z.enum([
    'casual_work',
    'subcontracting',
    'partnerships',
  ]),
  service_category: z.string().min(1, 'Service category is required'),
  skill_requirements: z
    .array(z.string())
    .min(1, 'At least one skill is required'),
  experience_level: z.enum(['entry', 'intermediate', 'senior', 'expert']),
  budget_range_min: z.number().min(0).optional(),
  budget_range_max: z.number().min(0).optional(),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  work_arrangement: z.enum(['remote', 'onsite', 'hybrid']),
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
});

type InternalJobFormData = z.infer<typeof internalJobFormSchema>;

interface InternalJobFormProps {
  initialData?: Partial<InternalJobFormData>;
  onSuccess?: (job: any) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function InternalJobForm({
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
}: InternalJobFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InternalJobFormData>({
    resolver: zodResolver(internalJobFormSchema),
    defaultValues: {
      job_type: 'contractor_internal',
      internal_job_category: 'casual_work',
      service_category: 'catering',
      work_arrangement: 'onsite',
      is_remote: false,
      ...initialData,
    },
  });

  const watchedJobCategory = watch('internal_job_category');
  const watchedWorkArrangement = watch('work_arrangement');
  const watchedSkills = watch('skill_requirements') || [];

  const onSubmit = async (data: InternalJobFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/jobs/internal', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          job_type: 'contractor_internal',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save internal job');
      }

      onSuccess?.(result.job);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Internal job form submission error:', error);
      }
      setError(
        error instanceof Error ? error.message : 'Failed to save internal job'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !watchedSkills.includes(skillInput.trim())) {
      setValue('skill_requirements', [...watchedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setValue(
      'skill_requirements',
      watchedSkills.filter(skill => skill !== skillToRemove)
    );
  };

  const getJobCategoryIcon = (category: string) => {
    switch (category) {
      case 'casual_work':
        return <Users className="h-4 w-4" />;
      case 'subcontracting':
        return <Briefcase className="h-4 w-4" />;
      case 'partnerships':
        return <Building className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getJobCategoryColor = (category: string) => {
    switch (category) {
      case 'casual_work':
        return 'bg-blue-100 text-blue-800';
      case 'subcontracting':
        return 'bg-green-100 text-green-800';
      case 'partnerships':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          {isEditing
            ? 'Edit Internal Job Posting'
            : 'Create Internal Job Posting'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Post internal business opportunities for additional staff or
          subcontractors
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Job Category */}
          <div className="space-y-2">
            <Label htmlFor="internal_job_category">Job Category *</Label>
            <Select
              value={watchedJobCategory}
              onValueChange={value =>
                setValue('internal_job_category', value as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual_work">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Casual Work
                  </div>
                </SelectItem>
                <SelectItem value="subcontracting">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Subcontracting
                  </div>
                </SelectItem>
                <SelectItem value="partnerships">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Partnerships
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.internal_job_category && (
              <p className="text-sm text-red-600">
                {errors.internal_job_category.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Wedding Photographer for Summer Events"
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
              placeholder="Provide detailed information about the role, responsibilities, and what you're looking for..."
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

          {/* Skill Requirements */}
          <div className="space-y-2">
            <Label htmlFor="skill_requirements">Required Skills *</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  placeholder="Add a required skill..."
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              {watchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {errors.skill_requirements && (
              <p className="text-sm text-red-600">
                {errors.skill_requirements.message}
              </p>
            )}
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label htmlFor="experience_level">Experience Level *</Label>
            <Select
              value={watch('experience_level')}
              onValueChange={value =>
                setValue('experience_level', value as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPERIENCE_LEVELS).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.experience_level && (
              <p className="text-sm text-red-600">
                {errors.experience_level.message}
              </p>
            )}
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms *</Label>
            <Textarea
              id="payment_terms"
              {...register('payment_terms')}
              placeholder="e.g., $50-80/hour, project-based pricing, commission structure..."
              rows={3}
              className={errors.payment_terms ? 'border-red-500' : ''}
            />
            {errors.payment_terms && (
              <p className="text-sm text-red-600">
                {errors.payment_terms.message}
              </p>
            )}
          </div>

          {/* Work Arrangement */}
          <div className="space-y-2">
            <Label htmlFor="work_arrangement">Work Arrangement *</Label>
            <Select
              value={watchedWorkArrangement}
              onValueChange={value =>
                setValue('work_arrangement', value as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select work arrangement" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_ARRANGEMENTS).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.work_arrangement && (
              <p className="text-sm text-red-600">
                {errors.work_arrangement.message}
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
              placeholder="Any special requirements, certifications, or additional information..."
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
              {isEditing ? 'Update Internal Job' : 'Create Internal Job'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
