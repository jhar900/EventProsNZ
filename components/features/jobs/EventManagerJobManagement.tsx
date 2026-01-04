'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { JobWithDetails, JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';
import { InternalJobApplicationManager } from './InternalJobApplicationManager';
import { CreateJobModal } from './CreateJobModal';
import { ApplicationsListModal } from './ApplicationsListModal';

interface EventManagerJobManagementProps {
  userId: string;
  className?: string;
}

interface JobStats {
  total: number;
  active: number;
  filled: number;
  completed: number;
  cancelled: number;
  total_applications: number;
  total_views: number;
}

export function EventManagerJobManagement({
  userId,
  className = '',
}: EventManagerJobManagementProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);
  const [selectedJobApplications, setSelectedJobApplications] = useState<
    JobApplicationWithDetails[]
  >([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    active: 0,
    filled: 0,
    completed: 0,
    cancelled: 0,
    total_applications: 0,
    total_views: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showApplications2Modal, setShowApplications2Modal] = useState(false);
  const [selectedJobForApplications2, setSelectedJobForApplications2] =
    useState<JobWithDetails | null>(null);

  const fetchUserJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/jobs?posted_by_user_id=${userId}&job_type=event_manager&limit=100`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for better auth handling
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.jobs || []);
      calculateStats(result.jobs || []);
    } catch (error) {
      console.error('Fetch user jobs error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserJobs();
  }, [fetchUserJobs]);

  const fetchJobApplications = async (jobId: string) => {
    try {
      setLoadingApplications(true);
      setError(null);
      const url = `/api/jobs/${jobId}/applications`;
      console.log(
        '[EventManagerJobManagement] Fetching applications from:',
        url
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log(
        '[EventManagerJobManagement] Response status:',
        response.status,
        response.statusText
      );
      console.log('[EventManagerJobManagement] Response URL:', response.url);

      // Read response body only once
      let result: any = {};
      try {
        const text = await response.text();
        console.log(
          '[EventManagerJobManagement] Response text (first 200 chars):',
          text.substring(0, 200)
        );
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error(
          '[EventManagerJobManagement] Failed to parse response:',
          parseError
        );
        if (response.status === 404) {
          throw new Error(
            'API route not found. Please restart the development server.'
          );
        }
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error(
          '[EventManagerJobManagement] API error response:',
          result
        );
        throw new Error(
          result.error ||
            result.message ||
            `Failed to fetch applications (${response.status})`
        );
      }

      // Handle both success: true and direct applications array
      if (result.success === false) {
        console.error(
          '[EventManagerJobManagement] API returned success: false:',
          result
        );
        setSelectedJobApplications([]);
        return;
      }

      // The API returns { success: true, applications: [...], ... }
      const applications = result.applications || [];
      console.log(
        '[EventManagerJobManagement] Fetched applications:',
        applications.length
      );
      setSelectedJobApplications(applications);
    } catch (error) {
      console.error(
        '[EventManagerJobManagement] Fetch job applications error:',
        error
      );
      setSelectedJobApplications([]);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch applications'
      );
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleViewApplications = async (job: JobWithDetails) => {
    setSelectedJob(job);
    setShowApplicationsDialog(true);
    await fetchJobApplications(job.id);
  };

  const handleViewApplications2 = (job: JobWithDetails) => {
    setSelectedJobForApplications2(job);
    setShowApplications2Modal(true);
  };

  const handleApplicationUpdate = async (
    applicationId: string,
    status: string,
    notes?: string
  ) => {
    try {
      // Use the applications API endpoint pattern
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update application');
      }

      // Refresh applications
      if (selectedJob) {
        await fetchJobApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Update application error:', error);
      throw error;
    }
  };

  const handleApplicationMessage = async (
    applicationId: string,
    message: string
  ) => {
    // This would typically send a message via the messaging system
    console.log('Sending message to application:', applicationId, message);
    // For now, just log it
  };

  const calculateStats = (jobsData: JobWithDetails[]) => {
    const stats = jobsData.reduce(
      (acc, job) => {
        acc.total++;
        acc[job.status as keyof JobStats]++;
        acc.total_applications += job.application_count || 0;
        acc.total_views += job.view_count || 0;
        return acc;
      },
      {
        total: 0,
        active: 0,
        filled: 0,
        completed: 0,
        cancelled: 0,
        total_applications: 0,
        total_views: 0,
      }
    );
    setStats(stats);
  };

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update job status');
      }

      await fetchUserJobs();
    } catch (error) {
      console.error('Update job status error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update job status'
      );
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete job');
      }

      await fetchUserJobs();
    } catch (error) {
      console.error('Delete job error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete job');
    }
  };

  const handleEditJob = (jobId: string) => {
    // For now, redirect to job details page where edit functionality can be added
    // Or redirect to create page with edit mode
    router.push(`/jobs/${jobId}`);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'filled':
        return <Users className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600">
            Manage your job postings and applications
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowCreateJobModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_applications}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.total_views}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 5).map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {job.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {job.application_count || 0} applications •{' '}
                          {job.view_count || 0} views
                        </p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No jobs posted yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowCreateJobModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Job
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {job.title}
                            </h3>
                            <Badge className={getStatusColor(job.status)}>
                              {getStatusIcon(job.status)}
                              <span className="ml-1">
                                {job.status.charAt(0).toUpperCase() +
                                  job.status.slice(1)}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {job.timeline_start_date &&
                                new Date(
                                  job.timeline_start_date
                                ).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.budget_range_min &&
                                `$${job.budget_range_min.toLocaleString()}`}
                              {job.budget_range_max &&
                                ` - $${job.budget_range_max.toLocaleString()}`}
                            </span>
                            <span>
                              {job.application_count || 0} applications
                            </span>
                            <span>{job.view_count || 0} views</span>
                            <span>
                              Posted{' '}
                              {formatDistanceToNow(new Date(job.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewApplications(job)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Applications ({job.application_count || 0})
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewApplications2(job)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Applications 2
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditJob(job.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Select
                            value={job.status}
                            onValueChange={value =>
                              handleJobStatusChange(job.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="filled">Filled</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No jobs posted yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by creating your first job posting
                  </p>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreateJobModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Applications Dialog */}
      <Dialog
        open={showApplicationsDialog}
        onOpenChange={setShowApplicationsDialog}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <InternalJobApplicationManager
              key={selectedJob.id}
              jobId={selectedJob.id}
              applications={selectedJobApplications}
              onApplicationUpdate={handleApplicationUpdate}
              onApplicationMessage={handleApplicationMessage}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Job Modal */}
      <CreateJobModal
        open={showCreateJobModal}
        onOpenChange={setShowCreateJobModal}
        onSuccess={() => {
          // Refresh jobs list after successful creation
          fetchUserJobs();
        }}
      />

      {/* Applications 2 Modal */}
      {selectedJobForApplications2 && (
        <ApplicationsListModal
          jobId={selectedJobForApplications2.id}
          jobTitle={selectedJobForApplications2.title}
          open={showApplications2Modal}
          onClose={() => {
            setShowApplications2Modal(false);
            setSelectedJobForApplications2(null);
          }}
          userId={userId}
        />
      )}
    </div>
  );
}
