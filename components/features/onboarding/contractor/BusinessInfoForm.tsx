'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ServiceAreaMapping } from './ServiceAreaMapping';

const businessInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().min(5, 'Business address is required'),
  nzbn: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required'),
  social_links: z
    .object({
      website: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoFormProps {
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function BusinessInfoForm({
  onComplete,
  onNext,
  onPrevious,
}: BusinessInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>(
    []
  );
  const [coverageType, setCoverageType] = useState<'regions' | 'nationwide'>(
    'regions'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      social_links: {
        website: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        twitter: '',
      },
    },
  });

  const socialLinks = watch('social_links');

  const onSubmit = async (data: BusinessInfoFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Update data with selected service areas
    const formData = {
      ...data,
      service_areas: selectedServiceAreas,
    };

    try {
      const response = await fetch('/api/onboarding/contractor/step2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onComplete();
        onNext();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save business information');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Business Information
        </h2>
        <p className="text-gray-600">
          Tell us about your business and the services you offer
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company Name *
          </label>
          <input
            {...register('company_name')}
            type="text"
            id="company_name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your company name"
          />
          {errors.company_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.company_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="business_address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Address *
          </label>
          <AddressAutocomplete
            value={watch('business_address') || ''}
            onChange={value => setValue('business_address', value)}
            placeholder="Enter your business address"
            id="business_address"
          />
          {errors.business_address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.business_address.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="nzbn"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            NZBN (New Zealand Business Number) - Optional
          </label>
          <input
            {...register('nzbn')}
            type="text"
            id="nzbn"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your NZBN (optional)"
          />
          {errors.nzbn && (
            <p className="mt-1 text-sm text-red-600">{errors.nzbn.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your business and what makes you unique"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <ServiceAreaMapping
          serviceAreas={selectedServiceAreas}
          onChange={setSelectedServiceAreas}
          coverageType={coverageType}
          onCoverageTypeChange={setCoverageType}
        />
        {errors.service_areas && (
          <p className="mt-1 text-sm text-red-600">
            {errors.service_areas.message}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Links (Optional)
          </label>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="website"
                className="block text-xs text-gray-600 mb-1"
              >
                Website
              </label>
              <input
                {...register('social_links.website')}
                type="url"
                id="website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label
                htmlFor="facebook"
                className="block text-xs text-gray-600 mb-1"
              >
                Facebook
              </label>
              <input
                {...register('social_links.facebook')}
                type="url"
                id="facebook"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label
                htmlFor="instagram"
                className="block text-xs text-gray-600 mb-1"
              >
                Instagram
              </label>
              <input
                {...register('social_links.instagram')}
                type="url"
                id="instagram"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div>
              <label
                htmlFor="linkedin"
                className="block text-xs text-gray-600 mb-1"
              >
                LinkedIn
              </label>
              <input
                {...register('social_links.linkedin')}
                type="url"
                id="linkedin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label
                htmlFor="twitter"
                className="block text-xs text-gray-600 mb-1"
              >
                Twitter
              </label>
              <input
                {...register('social_links.twitter')}
                type="url"
                id="twitter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Previous
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
