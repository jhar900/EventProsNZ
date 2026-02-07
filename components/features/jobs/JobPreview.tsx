'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Clock,
  User,
  Building,
  Globe,
  Link2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobFormData } from '@/types/jobs';
import { EventData } from '@/components/features/jobs/EventSelector';

interface ContactPersonData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface JobPreviewProps {
  jobData: JobFormData;
  eventData?: EventData;
  contactPerson?: ContactPersonData;
  onEdit?: () => void;
  onSubmit?: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
}

export function JobPreview({
  jobData,
  eventData,
  contactPerson,
  onEdit,
  onSubmit,
  isEditing = false,
  isSubmitting = false,
}: JobPreviewProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBudget = () => {
    const {
      budget_type,
      budget_range_min,
      budget_range_max,
      budget_fixed,
      hourly_rate,
      daily_rate,
    } = jobData as any;

    switch (budget_type) {
      case 'fixed':
        return budget_fixed
          ? `$${budget_fixed.toLocaleString()} (Fixed)`
          : 'Fixed budget not specified';
      case 'hourly':
        return hourly_rate
          ? `$${hourly_rate.toLocaleString()}/hour`
          : 'Hourly rate not specified';
      case 'daily':
        return daily_rate
          ? `$${daily_rate.toLocaleString()}/day`
          : 'Daily rate not specified';
      case 'open':
        return 'Open to offers';
      case 'range':
      default:
        if (!budget_range_min && !budget_range_max)
          return 'Budget not specified';
        if (budget_range_min && budget_range_max) {
          return `$${budget_range_min.toLocaleString()} - $${budget_range_max.toLocaleString()}`;
        }
        if (budget_range_min)
          return `From $${budget_range_min.toLocaleString()}`;
        if (budget_range_max)
          return `Up to $${budget_range_max.toLocaleString()}`;
        return 'Budget not specified';
    }
  };

  const getBudgetLabel = () => {
    const { budget_type } = jobData as any;
    switch (budget_type) {
      case 'fixed':
        return 'Fixed Budget';
      case 'hourly':
        return 'Hourly Rate';
      case 'daily':
        return 'Daily Rate';
      case 'open':
        return 'Budget';
      case 'range':
      default:
        return 'Budget Range';
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    return jobType === 'event_manager'
      ? 'Event Manager Position'
      : 'Internal Contractor Role';
  };

  const getServiceCategoryLabel = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{jobData.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getJobTypeLabel(jobData.job_type)}
                </Badge>
                <Badge variant="outline">
                  {getServiceCategoryLabel(jobData.service_category)}
                </Badge>
                {jobData.is_remote && (
                  <Badge variant="outline" className="text-green-600">
                    <Globe className="h-3 w-3 mr-1" />
                    Remote OK
                  </Badge>
                )}
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit Job
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Job Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {jobData.description}
            </p>
          </div>

          {/* Linked Event Info */}
          {eventData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {eventData.title}
                  </h3>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p>
                      {eventData.event_type} •{' '}
                      {formatDate(eventData.event_date)}
                    </p>
                    {eventData.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {eventData.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget */}
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">
                  {getBudgetLabel()}
                </h4>
                <p className="text-gray-700">{formatBudget()}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-gray-700">{jobData.location}</p>
              </div>
            </div>

            {/* Timeline */}
            {(jobData.timeline_start_date || jobData.timeline_end_date) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Timeline</h4>
                  <p className="text-gray-700">
                    {jobData.timeline_start_date && jobData.timeline_end_date
                      ? `${formatDate(jobData.timeline_start_date)} - ${formatDate(jobData.timeline_end_date)}`
                      : jobData.timeline_start_date
                        ? `Starting ${formatDate(jobData.timeline_start_date)}`
                        : `Ending ${formatDate(jobData.timeline_end_date)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Person */}
            {contactPerson && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Contact Person</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <Avatar className="h-10 w-10">
                      {contactPerson.avatar_url ? (
                        <AvatarImage
                          src={contactPerson.avatar_url}
                          alt={contactPerson.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {getInitials(contactPerson.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {contactPerson.name}
                      </p>
                      <div className="flex flex-col gap-1">
                        {contactPerson.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{contactPerson.email}</span>
                          </div>
                        )}
                        {contactPerson.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{contactPerson.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Fallback to old contact info if no contact person */}
            {!contactPerson &&
              (jobData.contact_email || jobData.contact_phone) && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Contact</h4>
                    <div className="flex flex-col gap-1 mt-1">
                      {jobData.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {jobData.contact_email}
                          </span>
                        </div>
                      )}
                      {jobData.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {jobData.contact_phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Special Requirements */}
          {jobData.special_requirements && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Special Requirements
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {jobData.special_requirements}
              </p>
            </div>
          )}

          {/* Response Preferences */}
          {jobData.response_preferences && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Preferred Response Method
              </h3>
              <div className="flex items-center gap-2">
                {jobData.response_preferences === 'email' && (
                  <>
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Email</span>
                  </>
                )}
                {jobData.response_preferences === 'phone' && (
                  <>
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Phone</span>
                  </>
                )}
                {jobData.response_preferences === 'platform' && (
                  <>
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Platform Messages</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Job Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">
              Job Posting Guidelines
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about requirements and expectations</li>
              <li>• Include clear timeline and deliverables</li>
              <li>• Set realistic budget ranges</li>
              <li>• Provide reliable contact information</li>
              <li>• Be transparent about any constraints</li>
            </ul>
          </div>

          {/* Action Buttons */}
          {onSubmit && (
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button variant="outline" onClick={onEdit}>
                Back to Edit
              </Button>
              <Button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSubmit && !isSubmitting) {
                    onSubmit();
                  }
                }}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Updating...'
                  : isEditing
                    ? 'Update Job Posting'
                    : 'Post Job'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
