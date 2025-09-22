'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const businessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional(),
  service_categories: z
    .array(z.string())
    .max(10, 'Too many service categories')
    .optional(),
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
  onSuccess?: (businessProfile: any) => void;
  onError?: (error: string) => void;
}

const SERVICE_CATEGORIES = [
  'Catering',
  'Photography',
  'Videography',
  'Music & Entertainment',
  'Venues',
  'Decoration & Styling',
  'Event Planning',
  'Security',
  'Transportation',
  'Audio/Visual',
  'Floral Design',
  'Lighting',
  'Photobooth',
  'DJ Services',
  'Wedding Services',
  'Corporate Events',
  'Party Planning',
  'Other',
];

export default function BusinessProfileForm({
  onSuccess,
  onError,
}: BusinessProfileFormProps) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
  });

  const selectedCategories = watch('service_categories') || [];

  // Load existing business profile data
  useEffect(() => {
    if (user?.business_profile) {
      reset({
        company_name: user.business_profile.company_name || '',
        description: user.business_profile.description || '',
        website: user.business_profile.website || '',
        location: user.business_profile.location || '',
        service_categories: user.business_profile.service_categories || [],
      });
      setIsCreating(false);
    } else {
      setIsCreating(true);
    }
  }, [user, reset]);

  const onSubmit = async (data: BusinessProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const method = isCreating ? 'POST' : 'PUT';
      const response = await fetch('/api/user/business-profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update business profile');
      }

      // Refresh user data
      await refreshUser();

      onSuccess?.(result.businessProfile);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update business profile';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = selectedCategories;
    if (checked) {
      if (!currentCategories.includes(category)) {
        currentCategories.push(category);
      }
    } else {
      const index = currentCategories.indexOf(category);
      if (index > -1) {
        currentCategories.splice(index, 1);
      }
    }
    reset({ ...watch(), service_categories: currentCategories });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Business Information
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="company_name"
              className="block text-sm font-medium text-gray-700"
            >
              Company Name *
            </label>
            <input
              {...register('company_name')}
              type="text"
              id="company_name"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Business Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe your business and services..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-gray-700"
            >
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              id="website"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://your-website.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">
                {errors.website.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Business Location
            </label>
            <input
              {...register('location')}
              type="text"
              id="location"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Auckland, New Zealand"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">
                {errors.location.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_CATEGORIES.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={e =>
                      handleCategoryChange(category, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
            {errors.service_categories && (
              <p className="mt-1 text-sm text-red-600">
                {errors.service_categories.message}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? isCreating
                  ? 'Creating...'
                  : 'Saving...'
                : isCreating
                  ? 'Create Business Profile'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
