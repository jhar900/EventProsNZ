'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const systemSettingsSchema = z.object({
  site_name: z
    .string()
    .min(1, 'Site name is required')
    .max(100, 'Site name too long'),
  site_description: z.string().max(500, 'Description too long'),
  maintenance_mode: z.boolean(),
  registration_enabled: z.boolean(),
  email_verification_required: z.boolean(),
  max_file_upload_size: z.number().min(1).max(100),
  session_timeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
  max_users_per_page: z.number().min(10).max(1000),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface AdminSystemSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

export default function AdminSystemSettings({
  onSuccess,
  onError,
}: AdminSystemSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettingsFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings/system', {
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });
      const result = await response.json();

      if (response.ok) {
        setSettings(result.settings);
        reset(result.settings);
      } else {
        throw new Error(result.error || 'Failed to load system settings');
      }
    } catch (err) {
      // Error handling is done by the component state
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onSubmit = async (data: SystemSettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update system settings');
      }

      setSettings(result.settings);
      onSuccess?.(result.settings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update system settings';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          System Settings
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              General Configuration
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="site_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Site Name
                </label>
                <input
                  {...register('site_name')}
                  type="text"
                  id="site_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.site_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.site_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="max_file_upload_size"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max File Upload Size (MB)
                </label>
                <input
                  {...register('max_file_upload_size', { valueAsNumber: true })}
                  type="number"
                  id="max_file_upload_size"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.max_file_upload_size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_file_upload_size.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="site_description"
                className="block text-sm font-medium text-gray-700"
              >
                Site Description
              </label>
              <textarea
                {...register('site_description')}
                id="site_description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              {errors.site_description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.site_description.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              User Management
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...register('registration_enabled')}
                  type="checkbox"
                  id="registration_enabled"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="registration_enabled"
                  className="ml-2 text-sm text-gray-700"
                >
                  Allow new user registration
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('email_verification_required')}
                  type="checkbox"
                  id="email_verification_required"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="email_verification_required"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require email verification for new accounts
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              System Behavior
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="session_timeout"
                  className="block text-sm font-medium text-gray-700"
                >
                  Session Timeout (minutes)
                </label>
                <input
                  {...register('session_timeout', { valueAsNumber: true })}
                  type="number"
                  id="session_timeout"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.session_timeout && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.session_timeout.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="max_users_per_page"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Users Per Page
                </label>
                <input
                  {...register('max_users_per_page', { valueAsNumber: true })}
                  type="number"
                  id="max_users_per_page"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.max_users_per_page && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_users_per_page.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <input
                  {...register('maintenance_mode')}
                  type="checkbox"
                  id="maintenance_mode"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="maintenance_mode"
                  className="ml-2 text-sm text-gray-700"
                >
                  Enable maintenance mode (site will be unavailable to users)
                </label>
              </div>
            </div>
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
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
