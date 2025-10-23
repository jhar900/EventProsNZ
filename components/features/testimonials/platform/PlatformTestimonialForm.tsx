'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, StarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformTestimonialFormProps {
  userCategory: 'event_manager' | 'contractor';
  onSuccess?: () => void;
}

export function PlatformTestimonialForm({
  userCategory,
  onSuccess,
}: PlatformTestimonialFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState(userCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; feedback?: string }>(
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (rating === 0) {
      const errorMessage = 'Please select a rating';
      setErrors(prev => ({ ...prev, rating: errorMessage }));
      toast.error(errorMessage);
      return;
    }

    if (feedback.length < 10) {
      const errorMessage = 'Please provide at least 10 characters of feedback';
      setErrors(prev => ({ ...prev, feedback: errorMessage }));
      toast.error(errorMessage);
      return;
    }

    if (feedback.length > 2000) {
      const errorMessage = 'Feedback must be less than 2000 characters';
      setErrors(prev => ({ ...prev, feedback: errorMessage }));
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/testimonials/platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit testimonial');
      }

      toast.success(
        'Testimonial submitted successfully! It will be reviewed before being published.'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/testimonials');
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit testimonial';
      toast.error(errorMessage);
      setErrors(prev => ({ ...prev, feedback: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    filled,
  }: {
    value: number;
    filled: boolean;
  }) => (
    <button
      type="button"
      className={`transition-colors ${
        filled ? 'text-yellow-400' : 'text-gray-300'
      } hover:text-yellow-400`}
      onMouseEnter={() => setHoveredRating(value)}
      onMouseLeave={() => setHoveredRating(0)}
      onClick={() => setRating(value)}
    >
      <StarIcon className="h-8 w-8" />
    </button>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Help others understand the value of Event Pros NZ by sharing your
          experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label htmlFor="rating">
              Rate your experience with Event Pros NZ
            </Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(value => (
                <StarRating
                  key={value}
                  value={value}
                  filled={value <= (hoveredRating || rating)}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 &&
                  (rating === 1
                    ? 'Poor'
                    : rating === 2
                      ? 'Fair'
                      : rating === 3
                        ? 'Good'
                        : rating === 4
                          ? 'Very Good'
                          : 'Excellent')}
              </span>
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating}</p>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label>I am a:</Label>
            <RadioGroup
              value={category}
              onValueChange={value =>
                setCategory(value as 'event_manager' | 'contractor')
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="event_manager" id="event_manager" />
                <Label htmlFor="event_manager">Event Manager</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contractor" id="contractor" />
                <Label htmlFor="contractor">Contractor</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Feedback Section */}
          <div className="space-y-3">
            <Label htmlFor="feedback">
              Tell us about your experience
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="feedback"
              placeholder="Share your thoughts about using Event Pros NZ. What did you like? What could be improved?"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Minimum 10 characters</span>
              <span>{feedback.length}/2000</span>
            </div>
            {errors.feedback && (
              <p className="text-sm text-red-500">{errors.feedback}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
