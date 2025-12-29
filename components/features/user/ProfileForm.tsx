'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import AddressAutosuggest from './AddressAutosuggest';

const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  phone: z
    .string()
    .regex(/^(\+64|0)[2-9][0-9]{7,9}$/, 'Invalid NZ phone number')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Address too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (profile: any) => void;
  onError?: (error: string) => void;
}

export default function ProfileForm({
  userId: propUserId,
  onSuccess,
  onError,
}: ProfileFormProps) {
  const { user, refreshUser } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      // If viewing another user (admin), fetch their profile
      if (propUserId && propUserId !== user?.id) {
        try {
          setIsLoading(true);
          const response = await fetch(
            `/api/admin/users/${propUserId}/profile`,
            {
              credentials: 'include',
            }
          );

          if (response.ok) {
            const data = await response.json();
            const profile = data.profile;

            if (profile) {
              reset({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                bio: profile.bio || '',
                timezone: profile.timezone || 'Pacific/Auckland',
              });
            } else {
              // No profile exists, show empty form
              reset({
                first_name: '',
                last_name: '',
                phone: '',
                address: '',
                bio: '',
                timezone: 'Pacific/Auckland',
              });
            }
          } else {
            // API call failed, show error but still render form
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to load profile:', errorData);
            onError?.(errorData.error || 'Failed to load profile');
            // Still show empty form
            reset({
              first_name: '',
              last_name: '',
              phone: '',
              address: '',
              bio: '',
              timezone: 'Pacific/Auckland',
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          onError?.('Failed to load profile');
          // Still show empty form
          reset({
            first_name: '',
            last_name: '',
            phone: '',
            address: '',
            bio: '',
            timezone: 'Pacific/Auckland',
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Use logged-in user's profile
      if (user?.profile) {
        reset({
          first_name: user.profile.first_name || '',
          last_name: user.profile.last_name || '',
          phone: user.profile.phone || '',
          address: user.profile.address || '',
          bio: user.profile.bio || '',
          timezone: user.profile.timezone || 'Pacific/Auckland',
        });
      }
    };

    loadProfile();
  }, [user, propUserId, reset, onError]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear success message on new submission

    try {
      if (!targetUserId) {
        setError('User ID is required');
        return;
      }

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/profile`
        : '/api/user/profile';

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': targetUserId,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Refresh user data
      await refreshUser();

      // Show success message
      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      onSuccess?.(result.profile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile';
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
          Personal Information
        </h3>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  id="first_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  {...register('last_name')}
                  type="text"
                  id="last_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+64 21 123 4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <AddressAutosuggest
                name="address"
                placeholder="Start typing your address..."
                onAddressSelect={(address, coordinates) => {
                  console.log('Selected address:', address);
                  console.log('Coordinates:', coordinates);
                }}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                Bio
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tell us about yourself..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.bio.message}
                </p>
              )}
            </div>

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
                <option value="Pacific/Auckland">
                  Pacific/Auckland (NZST/NZDT)
                </option>
                <option value="Pacific/Chatham">
                  Pacific/Chatham (CHAST/CHADT)
                </option>
                <option value="UTC">UTC</option>
              </select>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.timezone.message}
                </p>
              )}
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
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
