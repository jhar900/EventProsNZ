'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const testimonialSchema = z.object({
  rating: z.number().min(1).max(5),
  review_text: z.string().min(10).max(2000),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface EligibilityCheck {
  eligible: boolean;
  inquiry_id?: string;
  contractor_name?: string;
  reason?: string;
}

interface TestimonialCreationProps {
  contractorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TestimonialCreation({
  contractorId,
  onSuccess,
  onCancel,
}: TestimonialCreationProps) {
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      rating: 5,
      review_text: '',
    },
  });

  const rating = watch('rating');

  useEffect(() => {
    checkEligibility();
  }, [contractorId]);

  const checkEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const response = await fetch(
        `/api/testimonials/create/eligibility?contractor_id=${contractorId}&event_manager_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      const data = await response.json();
      setEligibility(data);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError('Failed to check eligibility');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const onSubmit = async (data: TestimonialFormData) => {
    if (!eligibility?.eligible || !eligibility.inquiry_id) {
      setError('You are not eligible to create a testimonial');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/testimonials/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: contractorId,
          inquiry_id: eligibility.inquiry_id,
          rating: data.rating,
          review_text: data.review_text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create testimonial');
      }

      const result = await response.json();
      onSuccess();
    } catch (err) {
      console.error('Error creating testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create testimonial'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
        onClick={() => setValue('rating', i + 1)}
      />
    ));
  };

  if (isCheckingEligibility) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking eligibility...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">
              Cannot Create Testimonial
            </h3>
            <p className="text-gray-600 mb-4">{eligibility?.reason}</p>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>Write a Testimonial for {eligibility.contractor_name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">Rating *</Label>
            <div className="flex items-center space-x-1">
              {renderStars(rating)}
              <span className="ml-2 text-sm text-gray-600">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            </div>
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review_text">Your Review *</Label>
            <Textarea
              id="review_text"
              {...register('review_text')}
              placeholder="Share your experience working with this contractor..."
              className="min-h-[120px]"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Minimum 10 characters</span>
              <span>{watch('review_text')?.length || 0}/2000</span>
            </div>
            {errors.review_text && (
              <p className="text-sm text-red-600">
                {errors.review_text.message}
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Review Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on your actual experience with the contractor</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Your review will be moderated before being published</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Testimonial'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
