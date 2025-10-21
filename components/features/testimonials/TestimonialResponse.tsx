'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Edit, Check, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const responseSchema = z.object({
  response_text: z.string().min(10).max(2000),
});

type ResponseFormData = z.infer<typeof responseSchema>;

interface TestimonialResponse {
  id: string;
  response_text: string;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
}

interface TestimonialResponseProps {
  response: TestimonialResponse;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export function TestimonialResponse({
  response,
  isOwner = false,
  onUpdate,
}: TestimonialResponseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response_text: response.response_text,
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onSubmit = async (data: ResponseFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response_update = await fetch(
        `/api/testimonials/response/${response.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            response_text: data.response_text,
          }),
        }
      );

      if (!response_update.ok) {
        const errorData = await response_update.json();
        throw new Error(errorData.error || 'Failed to update response');
      }

      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating response:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update response'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="response_text">Your Response</Label>
              <Textarea
                id="response_text"
                {...register('response_text')}
                placeholder="Respond to this testimonial..."
                className="min-h-[100px]"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Minimum 10 characters</span>
                <span>{watch('response_text')?.length || 0}/2000</span>
              </div>
              {errors.response_text && (
                <p className="text-sm text-red-600">
                  {errors.response_text.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Update Response
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">
              Contractor Response
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {response.is_approved && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Approved
              </Badge>
            )}
            {!response.is_public && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                Pending Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-blue-800 mb-3 leading-relaxed">
          {response.response_text}
        </p>

        <div className="flex items-center justify-between text-sm text-blue-600">
          <span>{formatDate(response.created_at)}</span>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Response
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
