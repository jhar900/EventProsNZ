'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JobApplicationForm } from '@/components/features/jobs/JobApplicationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge';
import { JobWithDetails } from '@/types/jobs';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Globe,
} from 'lucide-react';

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Fetch job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful application
  const handleApplicationSuccess = (application: any) => {
    // Redirect to success page or show success message
    router.push(`/jobs/${jobId}/apply/success`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/jobs/${jobId}`);
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

  // Check if job is still active
  if (job.status !== 'active') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This job is no longer accepting applications
              </p>
              <JobStatusBadge status={job.status} />
              <div className="mt-4">
                <Button onClick={() => router.push('/jobs')}>
                  Back to Jobs
                </Button>
              </div>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply for Job</h1>
            <p className="text-gray-600 mt-2">
              Submit your application for this position
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Title */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {job.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <JobStatusBadge status={job.status} size="sm" />
                  <Badge variant="secondary" className="text-xs">
                    {job.job_type === 'event_manager'
                      ? 'Event Manager'
                      : 'Contractor'}
                  </Badge>
                  {job.is_remote && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Remote OK
                    </Badge>
                  )}
                </div>
              </div>

              {/* Key Details */}
              <div className="space-y-3">
                {/* Budget */}
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Budget Range
                    </p>
                    <p className="text-sm text-gray-700">{formatBudget()}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Location
                    </p>
                    <p className="text-sm text-gray-700">{job.location}</p>
                  </div>
                </div>

                {/* Timeline */}
                {(job.timeline_start_date || job.timeline_end_date) && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Timeline
                      </p>
                      <p className="text-sm text-gray-700">
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
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Posted By
                      </p>
                      <p className="text-sm text-gray-700">
                        {job.posted_by_user.profiles.first_name}{' '}
                        {job.posted_by_user.profiles.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description Preview */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Description
                </p>
                <p className="text-sm text-gray-700 line-clamp-4">
                  {job.description}
                </p>
              </div>

              {/* Special Requirements */}
              {job.special_requirements && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Special Requirements
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {job.special_requirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="lg:col-span-2">
          <JobApplicationForm
            jobId={jobId}
            jobTitle={job.title}
            onSuccess={handleApplicationSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
