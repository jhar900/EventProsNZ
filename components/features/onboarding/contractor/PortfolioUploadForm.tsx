'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  event_date: z.string().optional(),
});

const portfolioUploadSchema = z.object({
  portfolio_items: z
    .array(portfolioItemSchema)
    .min(1, 'At least one portfolio item is required'),
});

type PortfolioUploadFormData = z.infer<typeof portfolioUploadSchema>;

interface PortfolioUploadFormProps {
  onComplete: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PortfolioUploadForm({
  onComplete,
  onPrevious,
  onSubmit,
  isSubmitting,
}: PortfolioUploadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: number]: boolean;
  }>({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PortfolioUploadFormData>({
    resolver: zodResolver(portfolioUploadSchema),
    defaultValues: {
      portfolio_items: [
        {
          title: '',
          description: '',
          image_url: '',
          video_url: '',
          event_date: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'portfolio_items',
  });

  const portfolioItems = watch('portfolio_items');

  const addPortfolioItem = () => {
    append({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      event_date: '',
    });
  };

  const removePortfolioItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleFileUpload = async (file: File, index: number) => {
    setUploadingFiles(prev => ({ ...prev, [index]: true }));

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];

        const response = await fetch('/api/upload/portfolio-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Data,
            filename: file.name,
            contentType: file.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setValue(`portfolio_items.${index}.image_url`, data.url);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to upload file');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to upload file');
      console.error('File upload error:', error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [index]: false }));
    }
  };

  const validateVideoUrl = async (url: string, index: number) => {
    if (!url) return;

    try {
      const response = await fetch('/api/portfolio/validate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: url }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setValue(`portfolio_items.${index}.video_url`, data.embed_url);
        } else {
          setError(data.error || 'Invalid video URL');
        }
      }
    } catch (error) {
      setError('Failed to validate video URL');
      console.error('Video validation error:', error);
    }
  };

  const onFormSubmit = async (data: PortfolioUploadFormData) => {
    setError(null);

    // Validate YouTube URLs
    for (const item of data.portfolio_items) {
      if (
        item.video_url &&
        !item.video_url.includes('youtube.com') &&
        !item.video_url.includes('youtu.be')
      ) {
        setError('Only YouTube video URLs are supported');
        return;
      }
    }

    try {
      const response = await fetch('/api/onboarding/contractor/step4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onComplete();
        onSubmit();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save portfolio items');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Portfolio submission error:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Portfolio</h2>
        <p className="text-gray-600">
          Showcase your work with photos, videos, and testimonials
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Portfolio Item {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removePortfolioItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    {...register(`portfolio_items.${index}.title`)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Wedding Photography - Sarah & John"
                  />
                  {errors.portfolio_items?.[index]?.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.portfolio_items[index]?.title?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register(`portfolio_items.${index}.description`)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe this work and what made it special"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  <input
                    {...register(`portfolio_items.${index}.event_date`)}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo Upload
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, index);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {uploadingFiles[index] && (
                    <p className="mt-1 text-sm text-blue-600">Uploading...</p>
                  )}
                  {portfolioItems[index]?.image_url && (
                    <div className="mt-2">
                      <img
                        src={portfolioItems[index].image_url}
                        alt="Portfolio preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Video URL
                  </label>
                  <input
                    {...register(`portfolio_items.${index}.video_url`)}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                    onBlur={e => {
                      if (e.target.value) {
                        validateVideoUrl(e.target.value, index);
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Only YouTube URLs are supported
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={addPortfolioItem}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + Add Another Portfolio Item
          </Button>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Previous
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  );
}
