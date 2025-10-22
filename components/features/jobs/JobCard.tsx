'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookmarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Job } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  onSelect?: () => void;
  onApply?: () => void;
  showActions?: boolean;
  className?: string;
}

export function JobCard({
  job,
  onSelect,
  onApply,
  showActions = true,
  className = '',
}: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply) {
      setIsApplying(true);
      try {
        await onApply();
      } finally {
        setIsApplying(false);
      }
    }
  };

  const formatBudget = () => {
    if (job.budget_range_min && job.budget_range_max) {
      return `$${job.budget_range_min.toLocaleString()} - $${job.budget_range_max.toLocaleString()}`;
    } else if (job.budget_range_min) {
      return `From $${job.budget_range_min.toLocaleString()}`;
    } else if (job.budget_range_max) {
      return `Up to $${job.budget_range_max.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const formatTimeline = () => {
    if (job.timeline_start_date && job.timeline_end_date) {
      const start = new Date(job.timeline_start_date);
      const end = new Date(job.timeline_end_date);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (job.timeline_start_date) {
      return `Starting ${new Date(job.timeline_start_date).toLocaleDateString()}`;
    }
    return 'Timeline not specified';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'event_manager':
        return 'bg-purple-100 text-purple-800';
      case 'contractor_internal':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onSelect}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(job.status)}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              <Badge className={getJobTypeColor(job.job_type)}>
                {job.job_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className="p-1"
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <BookmarkIcon className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3">{job.description}</p>

        {/* Service Category */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Service:</span>
          <Badge variant="outline" className="text-xs">
            {job.service_category.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4" />
          <span>{job.location}</span>
          {job.is_remote && (
            <Badge variant="secondary" className="text-xs">
              Remote OK
            </Badge>
          )}
        </div>

        {/* Budget */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CurrencyDollarIcon className="h-4 w-4" />
          <span>{formatBudget()}</span>
        </div>

        {/* Timeline */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatTimeline()}</span>
        </div>

        {/* Contact Info */}
        {(job.contact_email || job.contact_phone) && (
          <div className="space-y-1">
            {job.contact_email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4" />
                <span>{job.contact_email}</span>
              </div>
            )}
            {job.contact_phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4" />
                <span>{job.contact_phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{job.view_count || 0} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>{job.application_count || 0} applications</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(job.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onSelect?.();
              }}
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying || job.status !== 'active'}
              className="flex-1"
            >
              {isApplying ? 'Applying...' : 'Apply Now'}
            </Button>
          </div>
        )}

        {/* Special Requirements */}
        {job.special_requirements && (
          <div className="pt-2 border-t">
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Special Requirements:
              </span>
              <p className="text-gray-600 mt-1 line-clamp-2">
                {job.special_requirements}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
