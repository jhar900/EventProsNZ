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
} from '@heroicons/react/24/outline';
import { Job, JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface JobCardProps {
  job: Job;
  onSelect?: () => void;
  onApply?: () => void;
  onEdit?: () => void;
  onViewApplications?: () => void;
  onSimpleApply?: () => void;
  userApplication?: JobApplicationWithDetails | undefined;
  onViewMyApplication?: (application: JobApplicationWithDetails) => void;
  showActions?: boolean;
  className?: string;
}

export function JobCard({
  job,
  onSelect,
  onApply,
  onEdit,
  onViewApplications,
  onSimpleApply,
  userApplication,
  onViewMyApplication,
  showActions = true,
  className = '',
}: JobCardProps) {
  const { user } = useAuth();
  const [isApplying, setIsApplying] = useState(false);

  // Check if current user is the job creator
  const isJobCreator = user?.id && job.posted_by_user_id === user.id;

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
      return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
    } else if (job.timeline_start_date) {
      return `Starting ${new Date(job.timeline_start_date).toLocaleDateString('en-GB')}`;
    }
    return 'Timeline not specified';
  };

  const extractCity = (location: string) => {
    if (!location) return 'Location not specified';
    // Split by comma and find the city (usually second-to-last or last non-postal-code segment)
    const parts = location.split(',').map(p => p.trim());
    // Filter out parts that look like postal codes (numbers only or "New Zealand")
    const filtered = parts.filter(
      p =>
        p &&
        !/^\d+$/.test(p) &&
        p.toLowerCase() !== 'new zealand' &&
        p.toLowerCase() !== 'nz'
    );
    // Return the last meaningful part (typically the city)
    return filtered.length > 0 ? filtered[filtered.length - 1] : location;
  };

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col ${className}`}
      onClick={onSelect}
    >
      <div className="flex flex-col flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {job.title}
            </h3>
          </div>
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
          <span>{extractCity(job.location)}</span>
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

        {/* Special Requirements */}
        {job.special_requirements && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">
              Special Requirements:
            </span>
            <p className="text-gray-600 mt-1 line-clamp-2">
              {job.special_requirements}
            </p>
          </div>
        )}

        {/* Spacer to push stats and actions to bottom */}
        <div className="flex-grow" />

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center space-x-1">
            <UserIcon className="h-4 w-4" />
            <span>
              {job.application_count || 0}{' '}
              {(job.application_count || 0) === 1
                ? 'application'
                : 'applications'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(job.created_at), {
                addSuffix: true,
              }).replace(/^about /, '~ ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 pt-2">
            {isJobCreator ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="flex-1"
                >
                  Edit Job
                </Button>
                <Button
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    onViewApplications?.();
                  }}
                  className="flex-1"
                >
                  View Applications
                </Button>
              </>
            ) : userApplication ? (
              <Button
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onViewMyApplication?.(userApplication);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                View My Application
              </Button>
            ) : (
              <>
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
                {onSimpleApply && (
                  <Button
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      console.log(
                        '[JobCard] Quick Apply clicked for job:',
                        job.id
                      );
                      onSimpleApply();
                    }}
                    disabled={job.status !== 'active'}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Quick Apply
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
