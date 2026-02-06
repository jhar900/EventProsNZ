'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge';
import { JobWithDetails } from '@/types/jobs';
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Globe,
  Eye,
  Users,
  Mail,
  Phone,
  ArrowLeft,
  Edit,
  Share,
} from 'lucide-react';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Helper function to blur email/phone
  const blurText = (text: string): string => {
    if (!text) return text;
    // Show first 2 characters and last 2 characters, blur the middle
    if (text.length <= 4) {
      return '••••';
    }
    const start = text.substring(0, 2);
    const end = text.substring(text.length - 2);
    const middle = '•'.repeat(Math.max(3, text.length - 4));
    return `${start}${middle}${end}`;
  };

  // Fetch job details
  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch job');
      }

      setJob(result.job);

      // Check if current user is the owner (this would need proper auth check)
      // For now, we'll assume it's not the owner
      setIsOwner(false);
    } catch (error) {
      console.error('Fetch job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  // Handle job application
  const handleApply = () => {
    router.push(`/jobs/${jobId}/apply`);
  };

  // Handle edit job
  const handleEdit = () => {
    router.push(`/jobs/${jobId}/edit`);
  };

  // Handle share job
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: job?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format budget
  const formatBudget = () => {
    if (!job) return 'Budget not specified';
    const { budget_range_min, budget_range_max } = job;
    if (!budget_range_min && !budget_range_max) return 'Budget not specified';
    if (budget_range_min && budget_range_max) {
      return `$${budget_range_min.toLocaleString()} - $${budget_range_max.toLocaleString()}`;
    }
    if (budget_range_min) return `From $${budget_range_min.toLocaleString()}`;
    if (budget_range_max) return `Up to $${budget_range_max.toLocaleString()}`;
    return 'Budget not specified';
  };

  // Load job on component mount
  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
              <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <JobStatusBadge status={job.status} />
                  <Badge variant="secondary">
                    {job.job_type === 'event_manager'
                      ? 'Event Manager'
                      : 'Contractor'}
                  </Badge>
                  <Badge variant="outline">
                    {job.service_category
                      .replace('_', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {job.is_remote && (
                    <Badge variant="outline" className="text-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Remote OK
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {isOwner && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {/* Special Requirements */}
          {job.special_requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Special Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {job.special_requirements}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Event Reference */}
          {job.event && (
            <Card>
              <CardHeader>
                <CardTitle>Related Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">
                    {job.event.title}
                  </h3>
                  <p className="text-blue-700 text-sm mt-1">
                    {job.event.event_type} • {formatDate(job.event.event_date)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Budget Range</h4>
                  <p className="text-gray-700">{formatBudget()}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Location</h4>
                  <p className="text-gray-700">{job.location}</p>
                </div>
              </div>

              {/* Timeline */}
              {(job.timeline_start_date || job.timeline_end_date) && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Timeline</h4>
                    <p className="text-gray-700">
                      {job.timeline_start_date && job.timeline_end_date
                        ? `${formatDate(job.timeline_start_date)} - ${formatDate(job.timeline_end_date)}`
                        : job.timeline_start_date
                          ? `Starting ${formatDate(job.timeline_start_date)}`
                          : `Ending ${formatDate(job.timeline_end_date)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Posted By */}
              {job.posted_by_user?.profiles && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Posted By</h4>
                    <p className="text-gray-700">
                      {job.posted_by_user.profiles.first_name}{' '}
                      {job.posted_by_user.profiles.last_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Posted</h4>
                  <p className="text-gray-700">{formatDate(job.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(job.contact_email || job.contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {user ? (
                      <a
                        href={`mailto:${job.contact_email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {job.contact_email}
                      </a>
                    ) : (
                      <span
                        className="filter blur-sm select-none pointer-events-none text-gray-600"
                        title="Sign in to view contact information"
                      >
                        {blurText(job.contact_email)}
                      </span>
                    )}
                  </div>
                )}
                {job.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {user ? (
                      <a
                        href={`tel:${job.contact_phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {job.contact_phone}
                      </a>
                    ) : (
                      <span
                        className="filter blur-sm select-none pointer-events-none text-gray-600"
                        title="Sign in to view contact information"
                      >
                        {blurText(job.contact_phone)}
                      </span>
                    )}
                  </div>
                )}
                {!user && (
                  <p className="text-sm text-gray-500 italic mt-2">
                    Sign in to view full contact information
                  </p>
                )}
                {job.response_preferences && (
                  <div className="text-sm text-gray-600">
                    Preferred response method: {job.response_preferences}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics (for job owner) */}
          {isOwner && job.analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Job Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Views</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {job.analytics.view_count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Applications</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {job.analytics.application_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              {job.status === 'active' && !isOwner ? (
                <Button onClick={handleApply} className="w-full">
                  Apply for this Job
                </Button>
              ) : job.status !== 'active' ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    This job is no longer accepting applications
                  </p>
                  <JobStatusBadge status={job.status} />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600">This is your job posting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
