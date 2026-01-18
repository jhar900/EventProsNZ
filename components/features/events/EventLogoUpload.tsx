'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

interface EventLogoUploadProps {
  value: string | null;
  onChange: (logoUrl: string | null) => void;
}

export function EventLogoUpload({ value, onChange }: EventLogoUploadProps) {
  const { user } = useAuth();
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

    const userId = user?.id;
    if (!userId) {
      setError('You must be logged in to upload a logo');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/event-logo', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.details || 'Upload failed'
        );
      }

      const result = await response.json();
      onChange(result.url);

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

  const handleRemoveLogo = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="eventLogo">Event Logo (Optional)</Label>
      <div className="flex items-center gap-4">
        {/* Image Preview/Placeholder */}
        {value ? (
          <div className="relative inline-block">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={value}
                alt="Event logo preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex-shrink-0">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}

        {/* Button and Info on the right */}
        <div className="flex flex-col gap-2 flex-1">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="eventLogo"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : value ? (
                <>
                  <Upload className="h-4 w-4" />
                  Change Logo
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, WebP. Maximum file size: 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
