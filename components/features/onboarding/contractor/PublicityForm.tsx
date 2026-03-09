'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingPreview } from '@/components/features/onboarding/PreviewContext';

const publicitySchema = z.object({
  community_goals: z.string().optional(),
  questions: z.string().optional(),
  show_on_homepage_map: z.boolean().default(false),
});

type PublicityFormData = z.infer<typeof publicitySchema>;

interface PublicityFormProps {
  onComplete: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PublicityForm({
  onComplete,
  onPrevious,
  onSubmit,
  isSubmitting,
}: PublicityFormProps) {
  const { user } = useAuth();
  const { isPreview } = useOnboardingPreview();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PublicityFormData>({
    resolver: zodResolver(publicitySchema),
    defaultValues: {
      community_goals: '',
      questions: '',
      show_on_homepage_map: false,
    },
  });

  const showOnHomepageMap = watch('show_on_homepage_map');

  // Load existing publicity data when component mounts
  useEffect(() => {
    const loadPublicityData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch('/api/user/publicity', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const publicityData = result.publicity;

          if (publicityData) {
            reset({
              community_goals: publicityData.community_goals || '',
              questions: publicityData.questions || '',
              show_on_homepage_map: publicityData.show_on_homepage_map ?? false,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load publicity data:', error);
        // Silently fail - user might not have publicity data yet
      }
    };

    loadPublicityData();
  }, [user?.id, reset]);

  const onFormSubmit = async (data: PublicityFormData) => {
    if (isPreview) {
      onComplete();
      return;
    }

    setError(null);

    // Check if user is authenticated before submitting
    if (!user) {
      setError('You must be logged in to submit this form');
      return;
    }

    try {
      const response = await fetch('/api/onboarding/contractor/step4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Send user ID in header - same as other steps
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          ...data,
          publish_to_contractors: true,
        }),
      });

      if (response.ok) {
        onComplete();
        onSubmit();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save publicity information');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Publicity</h2>
        <p className="text-gray-600">
          Information about how your business information will be used
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Publicity Disclaimer
          </h3>
          <p className="text-gray-700 mb-4">
            The information you have provided will be used to create a profile
            for yourself and a public profile page for your business. This
            business profile page will automatically be added to our contractors
            database and will be visible to Event Pros NZ site visitors who are
            looking for event contractors and service providers. Your business
            information may also be displayed on the home page of Event Pros NZ.
          </p>
          <p className="text-gray-700 mb-4">
            Please note, you will be able to edit your information, change the
            publicity settings and remove your public business profile page from
            your login portal at any time you wish.
          </p>

          <div className="space-y-3 mt-4">
            {/* Card 1: Publish to Contractors Database — always on, locked */}
            <div className="relative border-2 border-orange-500 bg-orange-50 shadow-md rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    disabled
                    className="h-6 w-6 text-orange-600 border-gray-300 rounded opacity-100 cursor-not-allowed"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">
                    Publish My Business Profile Page
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    This will add your business to the Event Pros NZ searchable
                    database making your business visible to site visitors and
                    event managers searching for contractors.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Show on Homepage Map — user choice */}
            <div
              className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer ${
                showOnHomepageMap
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() =>
                setValue('show_on_homepage_map', !showOnHomepageMap)
              }
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <input
                    {...register('show_on_homepage_map')}
                    type="checkbox"
                    id="show_on_homepage_map"
                    className="h-6 w-6 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="show_on_homepage_map"
                    className="text-base font-semibold text-gray-900 cursor-pointer block"
                  >
                    Publish My Business Address
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    This will add your address to your business profile page as
                    well as a pin of your business address to the map on the
                    Event Pros NZ homepage.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    We don&apos;t recommend ticking this if you work from home,
                    remotely or only have a PO Box address.{' '}
                    <span className="font-medium italic">
                      However, if you have an office that you operate your
                      business from, this will give your business more exposure!
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="community_goals"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What do you want to gain from being a part of the Event Pros
            community? (Optional)
          </label>
          <textarea
            {...register('community_goals')}
            id="community_goals"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Connect with more event managers, grow my business, showcase my work..."
          />
          {errors.community_goals && (
            <p className="mt-1 text-sm text-red-600">
              {errors.community_goals.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="questions"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Do you have any questions about Event Pros NZ that our team will be
            able to answer? (Optional)
          </label>
          <textarea
            {...register('questions')}
            id="questions"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., How does the matching process work? What are the subscription tiers?"
          />
          {errors.questions && (
            <p className="mt-1 text-sm text-red-600">
              {errors.questions.message}
            </p>
          )}
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
            {isSubmitting ? 'Joining...' : 'Join Event Pros NZ'}
          </Button>
        </div>
      </form>
    </div>
  );
}
