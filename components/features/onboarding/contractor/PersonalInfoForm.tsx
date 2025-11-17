'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AddressAutocomplete } from './AddressAutocomplete';

const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  address: z.string().min(5, 'Address is required'),
  profile_photo_url: z.string().min(1, 'Profile photo is required'),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  onComplete: () => void;
  onNext: () => void;
}

export function PersonalInfoForm({
  onComplete,
  onNext,
}: PersonalInfoFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  const profilePhotoUrl = watch('profile_photo_url');

  // Load existing profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const profile = result.profile;

          if (profile) {
            // Populate form with existing data
            reset({
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || '',
              address: profile.address || '',
              profile_photo_url: profile.avatar_url || '',
            });
          }
        }
      } catch (error) {
        // Silently fail - user might not have a profile yet
        console.error('Failed to load profile data:', error);
      }
    };

    loadProfileData();
  }, [user?.id, reset]);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      if (!user?.id) {
        setUploadError('User not authenticated');
        return;
      }

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-user-id': user.id,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      // Set the avatar URL from the response
      if (result.avatar_url) {
        setValue('profile_photo_url', result.avatar_url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: PersonalInfoFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Check if user is authenticated before submitting
    if (!user) {
      setError('You must be logged in to submit this form');
      setIsSubmitting(false);
      return;
    }

    // Ensure profile_photo_url is included (required field)
    const submitData = {
      ...data,
      profile_photo_url: data.profile_photo_url || '',
    };

    try {
      const response = await fetch('/api/onboarding/contractor/step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Send user ID in header - same as profile settings
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onComplete();
        onNext();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to save personal information';
        setError(errorMessage);
        console.error('Personal info submission error:', errorData);
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
          Personal Information
        </h2>
        <p className="text-gray-600">
          Tell us about yourself so event managers can contact you
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{uploadError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo Upload */}
        <div>
          <label
            htmlFor="photo-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Profile Picture *
          </label>
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profilePhotoUrl} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </label>
              <input
                ref={fileInputRef}
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG or WebP. Max size 5MB. Required.
              </p>
              {errors.profile_photo_url && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.profile_photo_url.message}
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600 mt-1">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First Name *
            </label>
            <input
              {...register('first_name')}
              type="text"
              id="first_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last Name *
            </label>
            <input
              {...register('last_name')}
              type="text"
              id="last_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number *
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Address *
          </label>
          <AddressAutocomplete
            value={watch('address') || ''}
            onChange={value => setValue('address', value)}
            placeholder="Enter your address"
            id="address"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
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
