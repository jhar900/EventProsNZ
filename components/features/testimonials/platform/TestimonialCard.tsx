'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  rating: number;
  feedback: string;
  category: 'event_manager' | 'contractor';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  approved_at?: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  showStatus?: boolean;
  showActions?: boolean;
  onEdit?: (testimonial: Testimonial) => void;
  onDelete?: (testimonial: Testimonial) => void;
  className?: string;
}

export function TestimonialCard({
  testimonial,
  showStatus = false,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: TestimonialCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          'h-4 w-4',
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        )}
        data-testid="star"
      />
    ));
  };

  const getCategoryLabel = (category: string) => {
    return category === 'event_manager' ? 'Event Manager' : 'Contractor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {testimonial.user.profile_photo_url ? (
              <img
                src={testimonial.user.profile_photo_url}
                alt={`${testimonial.user.first_name} ${testimonial.user.last_name}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {testimonial.user.first_name[0]}
                  {testimonial.user.last_name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Testimonial Content */}
          <div className="flex-1 min-w-0">
            {/* Header with rating and status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {renderStars(testimonial.rating)}
                </div>
                <span className="text-sm text-gray-500">
                  {testimonial.rating}/5
                </span>
                {testimonial.is_verified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              {showStatus && (
                <Badge className={getStatusColor(testimonial.status)}>
                  {testimonial.status.charAt(0).toUpperCase() +
                    testimonial.status.slice(1)}
                </Badge>
              )}
            </div>

            {/* Testimonial Text */}
            <p className="text-gray-700 mb-3">{testimonial.feedback}</p>

            {/* User Info and Date */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {testimonial.user.first_name} {testimonial.user.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {getCategoryLabel(testimonial.category)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {formatDate(testimonial.created_at)}
                </p>
                {testimonial.approved_at && (
                  <p className="text-xs text-green-600">
                    Approved {formatDate(testimonial.approved_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                {onEdit && (
                  <button
                    onClick={() => onEdit(testimonial)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(testimonial)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
