'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AvatarUploadProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (avatarUrl: string) => void;
  onError?: (error: string) => void;
}

export default function AvatarUpload({
  userId: propUserId,
  onSuccess,
  onError,
}: AvatarUploadProps) {
  const { user, refreshUser, isLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load avatar for the target user
  useEffect(() => {
    const loadAvatar = async () => {
      if (!targetUserId) return;

      // If viewing another user (admin), fetch their profile
      if (propUserId && propUserId !== user?.id) {
        try {
          setIsLoadingAvatar(true);
          const response = await fetch(`/api/admin/users/${propUserId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            const profile = Array.isArray(data.user?.profiles)
              ? data.user.profiles[0]
              : data.user?.profiles;
            setAvatarUrl(profile?.avatar_url || null);
          }
        } catch (error) {
          console.error('Error loading avatar:', error);
        } finally {
          setIsLoadingAvatar(false);
        }
      } else {
        // Use logged-in user's avatar
        const profileData = Array.isArray(user?.profile)
          ? user.profile[0]
          : user?.profile;
        setAvatarUrl(profileData?.avatar_url || null);
      }
    };

    loadAvatar();
  }, [targetUserId, propUserId, user?.id, user?.profile]);

  const displayAvatarUrl = avatarUrl;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/avatar`
        : '/api/user/avatar';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-user-id': targetUserId || '',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      // Wait a moment for database to be updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh user data
      console.log('AvatarUpload - About to call refreshUser()');
      await refreshUser();
      console.log('AvatarUpload - refreshUser() completed');

      console.log('Avatar uploaded successfully, user data:', user);
      console.log('Avatar URL:', result.avatar_url);

      onSuccess?.(result.avatar_url);

      // Show success message
      setError(null);
      setSuccessMessage('Profile picture updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAvatar = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/avatar`
        : '/api/user/avatar';

      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-user-id': targetUserId || '',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete avatar');
      }

      // Refresh user data
      await refreshUser();

      onSuccess?.('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete avatar';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Profile Picture
        </h3>

        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {isLoading || isLoadingAvatar ? (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
              </div>
            ) : displayAvatarUrl ? (
              <img
                className="h-20 w-20 rounded-full object-cover"
                src={displayAvatarUrl}
                alt="Profile"
                onLoad={() => console.log('Avatar image loaded successfully')}
                onError={() => console.log('Avatar image failed to load')}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-2">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={isUploading || isLoading || isLoadingAvatar}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </button>

              {displayAvatarUrl && !isLoading && !isLoadingAvatar && (
                <button
                  type="button"
                  onClick={deleteAvatar}
                  disabled={isDeleting || isLoading || isLoadingAvatar}
                  className="ml-3 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Remove Photo'}
                </button>
              )}

              <p className="text-sm text-gray-500">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>

            {error && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2">
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
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
