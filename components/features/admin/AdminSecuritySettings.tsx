'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const securitySettingsSchema = z.object({
  password_min_length: z.number().min(6).max(50),
  password_require_special_chars: z.boolean(),
  password_require_numbers: z.boolean(),
  password_require_uppercase: z.boolean(),
  max_login_attempts: z.number().min(3).max(20),
  lockout_duration: z.number().min(5).max(1440), // 5 minutes to 24 hours
  two_factor_required: z.boolean(),
  session_security: z.boolean(),
  ip_whitelist_enabled: z.boolean(),
  ip_whitelist: z.string().optional(),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

interface AdminSecuritySettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

export default function AdminSecuritySettings({
  onSuccess,
  onError,
}: AdminSecuritySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SecuritySettingsFormData | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings/security', {
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });
      const result = await response.json();

      if (response.ok) {
        setSettings(result.settings);
        reset(result.settings);
      } else {
        throw new Error(result.error || 'Failed to load security settings');
      }
    } catch (err) {
      // Error handling is done by the component state
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onSubmit = async (data: SecuritySettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update security settings');
      }

      setSettings(result.settings);
      onSuccess?.(result.settings);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update security settings';
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
          Security Settings
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Password Requirements
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password_min_length"
                  className="block text-sm font-medium text-gray-700"
                >
                  Minimum Password Length
                </label>
                <input
                  {...register('password_min_length', { valueAsNumber: true })}
                  type="number"
                  id="password_min_length"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.password_min_length && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password_min_length.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  {...register('password_require_special_chars')}
                  type="checkbox"
                  id="password_require_special_chars"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="password_require_special_chars"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require special characters (!@#$%^&*)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('password_require_numbers')}
                  type="checkbox"
                  id="password_require_numbers"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="password_require_numbers"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require numbers (0-9)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('password_require_uppercase')}
                  type="checkbox"
                  id="password_require_uppercase"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="password_require_uppercase"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require uppercase letters (A-Z)
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Login Security
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="max_login_attempts"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Login Attempts
                </label>
                <input
                  {...register('max_login_attempts', { valueAsNumber: true })}
                  type="number"
                  id="max_login_attempts"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.max_login_attempts && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_login_attempts.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lockout_duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lockout Duration (minutes)
                </label>
                <input
                  {...register('lockout_duration', { valueAsNumber: true })}
                  type="number"
                  id="lockout_duration"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.lockout_duration && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lockout_duration.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Advanced Security
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...register('two_factor_required')}
                  type="checkbox"
                  id="two_factor_required"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="two_factor_required"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require two-factor authentication for admin accounts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('session_security')}
                  type="checkbox"
                  id="session_security"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="session_security"
                  className="ml-2 text-sm text-gray-700"
                >
                  Enhanced session security (IP validation)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('ip_whitelist_enabled')}
                  type="checkbox"
                  id="ip_whitelist_enabled"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="ip_whitelist_enabled"
                  className="ml-2 text-sm text-gray-700"
                >
                  Enable IP whitelist for admin access
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="ip_whitelist"
                className="block text-sm font-medium text-gray-700"
              >
                IP Whitelist (one IP per line)
              </label>
              <textarea
                {...register('ip_whitelist')}
                id="ip_whitelist"
                rows={4}
                placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              {errors.ip_whitelist && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ip_whitelist.message}
                </p>
              )}
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
              {isLoading ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
