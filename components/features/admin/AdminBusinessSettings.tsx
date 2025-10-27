'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const businessSettingsSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description too long').optional(),
  subscription_tier: z.enum(['free', 'essential', 'premium', 'enterprise']),
  industry: z.string().max(100, 'Industry too long').optional(),
  company_size: z
    .enum(['1-10', '11-50', '51-200', '201-1000', '1000+'])
    .optional(),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
});

type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;

interface AdminBusinessSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'essential', label: 'Essential' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export default function AdminBusinessSettings({
  onSuccess,
  onError,
}: AdminBusinessSettingsProps) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessSettingsFormData>({
    resolver: zodResolver(businessSettingsSchema),
  });

  // Load existing business profile data
  useEffect(() => {
    if (user?.business_profile) {
      reset({
        company_name: user.business_profile.company_name || '',
        website: user.business_profile.website || '',
        description: user.business_profile.description || '',
        subscription_tier: user.business_profile.subscription_tier || 'free',
        industry: user.business_profile.industry || '',
        company_size: user.business_profile.company_size || '',
        founded_year: user.business_profile.founded_year || undefined,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: BusinessSettingsFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/user/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update business profile');
      }

      // Refresh user data
      await refreshUser();

      // Show success message
      setSuccessMessage('Business settings updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      onSuccess?.(result.businessProfile);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update business settings';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Business Information
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Company Details
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="company_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name
                </label>
                <input
                  {...register('company_name')}
                  type="text"
                  id="company_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter company name"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.company_name.message}
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Describe your business..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Business Details
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="subscription_tier"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subscription Tier
                </label>
                <select
                  {...register('subscription_tier')}
                  id="subscription_tier"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  {SUBSCRIPTION_TIERS.map(tier => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
                {errors.subscription_tier && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subscription_tier.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-medium text-gray-700"
                >
                  Industry
                </label>
                <input
                  {...register('industry')}
                  type="text"
                  id="industry"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="e.g., Event Management"
                />
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.industry.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="company_size"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Size
                </label>
                <select
                  {...register('company_size')}
                  id="company_size"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
                {errors.company_size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.company_size.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="founded_year"
                className="block text-sm font-medium text-gray-700"
              >
                Founded Year
              </label>
              <input
                {...register('founded_year', { valueAsNumber: true })}
                type="number"
                id="founded_year"
                min="1800"
                max={new Date().getFullYear()}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="2024"
              />
              {errors.founded_year && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.founded_year.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end items-center">
            {successMessage && (
              <div className="mr-4 bg-green-50 border border-green-200 rounded-md p-2">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 ease-in-out"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
