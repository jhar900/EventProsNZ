'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const settingsSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  show_on_homepage_map: z.boolean(),
  publish_to_contractors: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface UserSettingsProps {
  userId?: string | null; // Optional: for admin viewing other users
  userRole?: 'event_manager' | 'contractor' | 'admin'; // Optional: user role for conditional rendering
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
  readOnly?: boolean; // Optional: if true, disable editing (for admin view)
}

export default function UserSettings({
  userId: propUserId,
  userRole: propUserRole,
  onSuccess,
  onError,
  readOnly = false,
}: UserSettingsProps) {
  const { user } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const targetUserRole = propUserRole || user?.role;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      show_on_homepage_map: false,
      publish_to_contractors: false,
    },
  });

  // Watch form values for debugging
  const formValues = watch();
  const publishToContractors = watch('publish_to_contractors');
  console.log('UserSettings: Current form values:', formValues);
  console.log('UserSettings: Form errors:', errors);

  // Uncheck show_on_homepage_map if publish_to_contractors is unchecked
  useEffect(() => {
    if (!publishToContractors) {
      setValue('show_on_homepage_map', false);
    }
  }, [publishToContractors, setValue]);

  const loadSettings = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setIsFetching(true);
      setError(null);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/settings`
        : '/api/user/settings';

      const response = await fetch(apiEndpoint, {
        headers: {
          'x-user-id': targetUserId,
        },
        credentials: 'include',
      });
      const result = await response.json();

      if (response.ok && result.settings) {
        // Filter to only include fields in the schema
        const filteredSettings: SettingsFormData = {
          email_notifications: Boolean(
            result.settings.email_notifications ?? true
          ),
          sms_notifications: Boolean(
            result.settings.sms_notifications ?? false
          ),
          marketing_emails: Boolean(result.settings.marketing_emails ?? false),
          show_on_homepage_map: Boolean(
            result.settings.show_on_homepage_map ?? false
          ),
          publish_to_contractors: Boolean(
            result.settings.publish_to_contractors ?? false
          ),
        };
        setSettings(filteredSettings);
        reset(filteredSettings);
      } else {
        // Use default settings if API fails
        const defaultSettings: SettingsFormData = {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: false,
          show_on_homepage_map: false,
          publish_to_contractors: false,
        };
        setSettings(defaultSettings);
        reset(defaultSettings);
        if (result.error) {
          console.warn(
            'Failed to load settings, using defaults:',
            result.error
          );
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load settings';
      console.error('Error loading settings:', errorMessage);

      // Use default settings on error
      const defaultSettings: SettingsFormData = {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        show_on_homepage_map: false,
        publish_to_contractors: false,
      };
      setSettings(defaultSettings);
      reset(defaultSettings);
      setError('Failed to load settings. Using default values.');
    } finally {
      setIsFetching(false);
    }
  }, [targetUserId, propUserId, user?.id, reset]);

  // Load settings on mount
  useEffect(() => {
    if (targetUserId) {
      loadSettings();
    } else {
      // If no user, set default settings and stop loading
      const defaultSettings: SettingsFormData = {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        show_on_homepage_map: false,
        publish_to_contractors: false,
      };
      setSettings(defaultSettings);
      reset(defaultSettings);
      setIsFetching(false);
    }
  }, [targetUserId, loadSettings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!targetUserId) {
      setError('User ID is required to update settings');
      return;
    }

    if (readOnly) {
      setError('Settings are read-only in this view');
      return;
    }

    console.log('UserSettings: onSubmit called with data:', data);
    console.log(
      'UserSettings: publish_to_contractors value:',
      data.publish_to_contractors
    );

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const requestBody = JSON.stringify(data);
      console.log(
        'UserSettings: Sending PUT request to /api/user/settings with body:',
        requestBody
      );

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/settings`
        : '/api/user/settings';

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': targetUserId,
        },
        credentials: 'include',
        body: requestBody,
      });

      console.log('UserSettings: Response status:', response.status);
      const result = await response.json();
      console.log('UserSettings: Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setSettings(result.settings);
      setSuccessMessage('Settings saved successfully!');
      onSuccess?.(result.settings);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update settings';
      console.error('UserSettings: Error updating settings:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-1/4 mt-6"></div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    // This shouldn't happen, but provide a fallback
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load settings.</p>
            <button
              onClick={loadSettings}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Settings Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Publication
            </h3>

            <form
              onSubmit={e => {
                console.log('UserSettings: Form onSubmit event triggered');
                console.log('UserSettings: Event:', e);
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
              {/* Publication settings - only show for contractors */}
              {targetUserRole === 'contractor' && (
                <div>
                  <div className="space-y-4">
                    {/* Card 1: Publish to Contractors Database */}
                    <div
                      className={`relative border-2 rounded-lg p-5 transition-all cursor-pointer ${
                        publishToContractors
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${readOnly ? 'cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!readOnly) {
                          const currentValue = watch('publish_to_contractors');
                          setValue('publish_to_contractors', !currentValue);
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            {...register('publish_to_contractors')}
                            type="checkbox"
                            id="publish_to_contractors"
                            disabled={readOnly}
                            className="h-6 w-6 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="publish_to_contractors"
                            className="text-base font-semibold text-gray-900 cursor-pointer block"
                          >
                            Publish My Business Profile Page
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            This will add your business to the Event Pros NZ
                            searchable database making your business visible to
                            site visitors and event managers searching for
                            contractors
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Show on Homepage Map */}
                    <div
                      className={`relative border-2 rounded-lg p-5 transition-all ${
                        !publishToContractors
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : watch('show_on_homepage_map')
                            ? 'border-orange-500 bg-orange-50 shadow-md cursor-pointer'
                            : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                      } ${readOnly ? 'cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!readOnly && publishToContractors) {
                          const currentValue = watch('show_on_homepage_map');
                          setValue('show_on_homepage_map', !currentValue);
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            {...register('show_on_homepage_map')}
                            type="checkbox"
                            id="show_on_homepage_map"
                            disabled={readOnly || !publishToContractors}
                            className="h-6 w-6 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="show_on_homepage_map"
                            className={`text-base font-semibold block cursor-pointer ${
                              !publishToContractors
                                ? 'text-gray-400'
                                : 'text-gray-900'
                            }`}
                          >
                            Publish My Business Address
                          </label>
                          <p
                            className={`text-sm mt-1 ${
                              !publishToContractors
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}
                          >
                            <p className="text-sm text-gray-600 mt-1">
                              This will add your address to your business
                              profile page as well as a pin of your business
                              address to the map on Event Pros NZ homepage
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              We don&apos;t recommend ticking this if you work
                              from home, remotely or only have a PO Box address.
                            </p>
                            <span className="font-medium italic">
                              However, if you have an office that you operate
                              your business from, this will give your business
                              more exposure!
                            </span>
                            {!publishToContractors && (
                              <span className="block mt-1 text-xs">
                                (Requires &quot;Add my business to the
                                contractors database&quot; to be enabled)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!readOnly && (
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
                        <p className="text-sm text-green-800">
                          {successMessage}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={() => {
                      console.log('Save Settings button clicked');
                      console.log('Form state:', {
                        isLoading,
                        userId: targetUserId,
                      });
                    }}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
