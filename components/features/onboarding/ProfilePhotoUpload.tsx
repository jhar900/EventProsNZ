'use client';

import { useState, useRef } from 'react';

interface ProfilePhotoUploadProps {
  data: string | null;
  onComplete: (photoUrl: string | null) => void;
  isLoading: boolean;
}

export function ProfilePhotoUpload({
  data,
  onComplete,
  isLoading,
}: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(data);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setPhotoUrl(result.url);
      onComplete(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/upload/profile-photo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setPhotoUrl(null);
      onComplete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onComplete(photoUrl);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Photo</h2>
        <p className="text-gray-600">
          Add a profile photo to help contractors recognize you (optional)
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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? 'Uploading...'
              : photoUrl
                ? 'Change Photo'
                : 'Upload Photo'}
          </button>

          <button
            onClick={handleSkip}
            disabled={uploading}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {photoUrl ? 'Continue' : 'Skip for now'}
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
