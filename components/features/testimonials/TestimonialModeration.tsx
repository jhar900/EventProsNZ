'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  Star,
  MessageCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const moderationSchema = z.object({
  moderation_status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  moderation_notes: z.string().max(1000).optional(),
});

type ModerationFormData = z.infer<typeof moderationSchema>;

interface Testimonial {
  id: string;
  rating: number;
  review_text: string;
  is_verified: boolean;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
  contractor: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
  };
  event_manager: {
    id: string;
    first_name: string;
    last_name: string;
  };
  inquiry: {
    id: string;
    subject: string;
    status: string;
    created_at: string;
  };
  moderation?: {
    id: string;
    moderation_status: string;
    moderation_notes?: string;
    moderated_at: string;
    moderator: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }[];
}

interface TestimonialModerationProps {
  testimonials: Testimonial[];
  isLoading?: boolean;
  onModerationUpdate?: () => void;
}

export function TestimonialModeration({
  testimonials,
  isLoading = false,
  onModerationUpdate,
}: TestimonialModerationProps) {
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ModerationFormData>({
    resolver: zodResolver(moderationSchema),
    defaultValues: {
      moderation_status: 'pending',
      moderation_notes: '',
    },
  });

  const moderationStatus = watch('moderation_status');

  const handleModerate = async (data: ModerationFormData) => {
    if (!selectedTestimonial) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/testimonials/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testimonial_id: selectedTestimonial.id,
          moderation_status: data.moderation_status,
          moderation_notes: data.moderation_notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to moderate testimonial');
      }

      setSelectedTestimonial(null);
      reset();
      onModerationUpdate?.();
    } catch (err) {
      console.error('Error moderating testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to moderate testimonial'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (testimonial: Testimonial) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(
        `/api/testimonials/${testimonial.id}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: true,
            is_public: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve testimonial');
      }

      onModerationUpdate?.();
    } catch (err) {
      console.error('Error approving testimonial:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to approve testimonial'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'flagged':
        return <Flag className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Moderation Form */}
      {selectedTestimonial && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Moderate Testimonial</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleModerate)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="moderation_status">Moderation Action</Label>
                <Select
                  value={moderationStatus}
                  onValueChange={value =>
                    setValue('moderation_status', value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Keep Pending</SelectItem>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="flagged">Flag for Review</SelectItem>
                  </SelectContent>
                </Select>
                {errors.moderation_status && (
                  <p className="text-sm text-red-600">
                    {errors.moderation_status.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="moderation_notes">
                  Moderation Notes (Optional)
                </Label>
                <Textarea
                  id="moderation_notes"
                  {...register('moderation_notes')}
                  placeholder="Add notes about this moderation decision..."
                  className="min-h-[80px]"
                />
                <div className="text-sm text-gray-500">
                  {watch('moderation_notes')?.length || 0}/1000 characters
                </div>
                {errors.moderation_notes && (
                  <p className="text-sm text-red-600">
                    {errors.moderation_notes.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedTestimonial(null);
                    reset();
                  }}
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
                      Processing...
                    </>
                  ) : (
                    'Moderate'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  No testimonials to moderate
                </p>
                <p className="text-sm">All testimonials have been reviewed.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          testimonials.map(testimonial => (
            <Card
              key={testimonial.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {testimonial.event_manager.first_name}{' '}
                        {testimonial.event_manager.last_name}
                      </h4>
                      {testimonial.is_verified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span>
                        for{' '}
                        {testimonial.contractor.company_name ||
                          `${testimonial.contractor.first_name} ${testimonial.contractor.last_name}`}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(testimonial.rating)}
                      <span className="text-sm text-gray-600">
                        {testimonial.rating} star
                        {testimonial.rating !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {testimonial.moderation &&
                      testimonial.moderation.length > 0 && (
                        <Badge
                          className={getStatusColor(
                            testimonial.moderation[0].moderation_status
                          )}
                        >
                          {getStatusIcon(
                            testimonial.moderation[0].moderation_status
                          )}
                          <span className="ml-1 capitalize">
                            {testimonial.moderation[0].moderation_status}
                          </span>
                        </Badge>
                      )}
                    {testimonial.is_approved && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {testimonial.review_text}
                </p>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-500">
                    <span>Inquiry: {testimonial.inquiry.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTestimonial(testimonial)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Moderate
                    </Button>
                    {!testimonial.is_approved && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(testimonial)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Quick Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
