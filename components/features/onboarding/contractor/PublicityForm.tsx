'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const publicitySchema = z.object({
  community_goals: z.string().optional(),
  questions: z.string().optional(),
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
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PublicityFormData>({
    resolver: zodResolver(publicitySchema),
    defaultValues: {
      community_goals: '',
      questions: '',
    },
  });

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
        body: JSON.stringify(data),
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
          <p className="text-gray-700">
            Please note, you will be able to edit your information, change the
            publicity settings and remove your public business profile page from
            your login portal at any time you wish.
          </p>
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
