'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react';

const settingsSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  timezone: z.string().max(50, 'Timezone too long'),
  language: z.string().max(10, 'Language code too long'),
  show_on_homepage_map: z.boolean(),
  publish_to_contractors: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface UserSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

const TIMEZONES = [
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT)' },
  { value: 'Pacific/Chatham', label: 'Pacific/Chatham (CHAST/CHADT)' },
  { value: 'UTC', label: 'UTC' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'mi', label: 'Te Reo Māori' },
];

interface VerificationStatus {
  userVerified: boolean;
  businessVerified?: boolean;
  verificationDate?: string;
  businessVerificationDate?: string;
}

export default function UserSettings({
  onSuccess,
  onError,
}: UserSettingsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsFormData | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      timezone: 'Pacific/Auckland',
      language: 'en',
      show_on_homepage_map: false,
      publish_to_contractors: false,
    },
  });

  // Watch form values for debugging
  const formValues = watch();
  console.log('UserSettings: Current form values:', formValues);
  console.log('UserSettings: Form errors:', errors);

  const loadVerificationStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingVerification(true);

      // Get user verification status from user object
      const userVerified = user.is_verified || false;

      setVerificationStatus({
        userVerified,
      });
    } catch (err) {
      console.error('Error loading verification status:', err);
      // Set default status on error
      setVerificationStatus({
        userVerified: user?.is_verified || false,
      });
    } finally {
      setLoadingVerification(false);
    }
  }, [user?.id, user?.is_verified]);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsFetching(true);
      setError(null);

      const response = await fetch('/api/user/settings', {
        headers: {
          'x-user-id': user.id,
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
          timezone: String(result.settings.timezone ?? 'Pacific/Auckland'),
          language: String(result.settings.language ?? 'en'),
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
          timezone: 'Pacific/Auckland',
          language: 'en',
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
        timezone: 'Pacific/Auckland',
        language: 'en',
        show_on_homepage_map: false,
        publish_to_contractors: false,
      };
      setSettings(defaultSettings);
      reset(defaultSettings);
      setError('Failed to load settings. Using default values.');
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, reset]);

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      loadSettings();
      loadVerificationStatus();
    } else {
      // If no user, set default settings and stop loading
      const defaultSettings: SettingsFormData = {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        timezone: 'Pacific/Auckland',
        language: 'en',
        show_on_homepage_map: false,
        publish_to_contractors: false,
      };
      setSettings(defaultSettings);
      reset(defaultSettings);
      setIsFetching(false);
      setLoadingVerification(false);
    }
  }, [user?.id, loadSettings, loadVerificationStatus, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!user?.id) {
      setError('You must be logged in to update settings');
      return;
    }

    console.log('UserSettings: onSubmit called with data:', data);
    console.log(
      'UserSettings: publish_to_contractors value:',
      data.publish_to_contractors
    );

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = JSON.stringify(data);
      console.log(
        'UserSettings: Sending PUT request to /api/user/settings with body:',
        requestBody
      );

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
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
      onSuccess?.(result.settings);
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
        {/* Verification Status Section */}
        {user && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Verification Status
                </h3>
              </div>

              {loadingVerification ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : verificationStatus ? (
                <div className="space-y-4">
                  {/* User Verification Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {verificationStatus.userVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Account Verification
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {verificationStatus.userVerified
                            ? 'Your account has been verified'
                            : 'Your account verification is pending'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        verificationStatus.userVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {verificationStatus.userVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  {/* Overall Status Message */}
                  {!verificationStatus.userVerified && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your account verification is pending. You will be
                        notified once verification is complete.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Unable to load verification status.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Settings & Preferences
            </h3>

            <form
              onSubmit={e => {
                console.log('UserSettings: Form onSubmit event triggered');
                console.log('UserSettings: Event:', e);
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  General
                </h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Timezone
                    </label>
                    <select
                      {...register('timezone')}
                      id="timezone"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.timezone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Language
                    </label>
                    <select
                      {...register('language')}
                      id="language"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    {errors.language && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.language.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Publication
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      {...register('show_on_homepage_map')}
                      type="checkbox"
                      id="show_on_homepage_map"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label
                      htmlFor="show_on_homepage_map"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Add a pin of my business address to the map on Event Pros
                      NZ homepage{' '}
                      <span className="text-gray-500 italic">
                        (This is more exposure for your business!)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      {...register('publish_to_contractors')}
                      type="checkbox"
                      id="publish_to_contractors"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label
                      htmlFor="publish_to_contractors"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Add my business to the contractors database and publish my
                      business profile page
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
                  onClick={() => {
                    console.log('Save Settings button clicked');
                    console.log('Form state:', { isLoading, user: user?.id });
                  }}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
