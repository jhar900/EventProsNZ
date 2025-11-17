'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProfilePhotoUploadProps {
  data: string | null;
  onComplete: (photoUrl: string | null) => void;
  onPhotoChange?: (photoUrl: string | null) => void;
  isLoading: boolean;
}

export function ProfilePhotoUpload({
  data,
  onComplete,
  onPhotoChange,
  isLoading,
}: ProfilePhotoUploadProps) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(data);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  // Store user ID in ref to ensure it's always available
  useEffect(() => {
    if (user?.id) {
      userIdRef.current = user.id;
      console.log('ProfilePhotoUpload: User ID stored in ref:', user.id);
    }
  }, [user?.id]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    // Get user ID - check both user from hook and ref to ensure it's available
    const userId = user?.id || userIdRef.current;
    if (!userId) {
      console.error(
        'User ID not available for upload. User from hook:',
        user?.id,
        'User from ref:',
        userIdRef.current
      );
      setError('You must be logged in to upload a photo');
      setUploading(false);
      return;
    }

    console.log('Uploading photo with user ID:', userId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(
          errorData.error || errorData.details || 'Upload failed'
        );
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      setPhotoUrl(result.url);

      // Call onPhotoChange if provided (to update parent state without advancing step)
      if (onPhotoChange) {
        onPhotoChange(result.url);
      }

      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    // Get user ID from hook or ref
    const userId = user?.id || userIdRef.current;
    if (!userId) {
      setError('You must be logged in to remove a photo');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/upload/profile-photo', {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setPhotoUrl(null);

      // Call onPhotoChange if provided (to update parent state without advancing step)
      if (onPhotoChange) {
        onPhotoChange(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (!photoUrl) {
      setError('Please upload a profile photo before continuing');
      return;
    }
    onComplete(photoUrl);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Photo</h2>
        <p className="text-gray-600">
          Add a profile photo to help contractors recognize you (required)
        </p>
      </div>

      <div className="space-y-6">
        {photoUrl ? (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={photoUrl}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Photo uploaded successfully
            </p>
            <button
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Remove photo
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
              <svg
                className="w-16 h-16 text-gray-400"
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
            <p className="mt-4 text-sm text-gray-600">No photo uploaded</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? 'Uploading...'
              : photoUrl
                ? 'Change Photo'
                : 'Upload Photo'}
          </button>

          <button
            onClick={handleContinue}
            disabled={uploading || !photoUrl}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Supported formats: JPEG, PNG, WebP</p>
          <p>Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  );
}
