'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Globe,
  Eye,
  Users,
} from 'lucide-react';
import { JobWithDetails } from '@/types/jobs';

interface JobCardProps {
  job: JobWithDetails;
  onView?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
}

export function JobCard({
  job,
  onView,
  onApply,
  showActions = true,
  isOwner = false,
}: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = () => {
    const { budget_range_min, budget_range_max } = job;
    if (!budget_range_min && !budget_range_max) return 'Budget not specified';
    if (budget_range_min && budget_range_max) {
      return `$${budget_range_min.toLocaleString()} - $${budget_range_max.toLocaleString()}`;
    }
    if (budget_range_min) return `From $${budget_range_min.toLocaleString()}`;
    if (budget_range_max) return `Up to $${budget_range_max.toLocaleString()}`;
    return 'Budget not specified';
  };

  const getJobTypeLabel = (jobType: string) => {
    return jobType === 'event_manager' ? 'Event Manager' : 'Contractor';
  };

  const getServiceCategoryLabel = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-xl line-clamp-2">{job.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
              <Badge variant="outline">
                {getServiceCategoryLabel(job.service_category)}
              </Badge>
              <Badge className={getStatusColor(job.status)}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              {job.is_remote && (
                <Badge variant="outline" className="text-green-600">
                  <Globe className="h-3 w-3 mr-1" />
                  Remote OK
                </Badge>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{job.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{job.application_count || 0}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Description Preview */}
        <p className="text-gray-700 line-clamp-3">{job.description}</p>

        {/* Key Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Budget */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">
              {formatBudget()}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-700">{job.location}</span>
          </div>

          {/* Timeline */}
          {(job.timeline_start_date || job.timeline_end_date) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-700">
                {job.timeline_start_date && job.timeline_end_date
                  ? `${formatDate(job.timeline_start_date)} - ${formatDate(job.timeline_end_date)}`
                  : job.timeline_start_date
                    ? `Starting ${formatDate(job.timeline_start_date)}`
                    : `Ending ${formatDate(job.timeline_end_date)}`}
              </span>
            </div>
          )}

          {/* Posted By */}
          {job.posted_by_user && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                Posted by {job.posted_by_user.first_name}{' '}
                {job.posted_by_user.last_name}
              </span>
            </div>
          )}
        </div>

        {/* Special Requirements Preview */}
        {job.special_requirements && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 line-clamp-2">
              <strong>Special Requirements:</strong> {job.special_requirements}
            </p>
          </div>
        )}

        {/* Event Reference */}
        {job.event && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Related Event:</strong> {job.event.title} (
              {job.event.event_type})
            </p>
            <p className="text-xs text-blue-600">
              Event Date: {formatDate(job.event.event_date)}
            </p>
          </div>
        )}

        {/* Posted Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Posted {formatDate(job.created_at)}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onView && (
              <Button variant="outline" onClick={() => onView(job.id)}>
                View Details
              </Button>
            )}
            {onApply && job.status === 'active' && !isOwner && (
              <Button onClick={() => onApply(job.id)}>Apply Now</Button>
            )}
            {isOwner && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  Analytics
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
