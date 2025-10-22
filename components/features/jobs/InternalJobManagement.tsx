'use client';

import React, { useState, useEffect } from 'react';
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
  Building,
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
} from 'lucide-react';
import { JobWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';
import { InternalJobCard } from './InternalJobCard';

interface InternalJobManagementProps {
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

export function InternalJobManagement({
  userId,
  className = '',
}: InternalJobManagementProps) {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
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

  useEffect(() => {
    fetchUserJobs();
    fetchUserApplications();
  }, [userId, fetchUserJobs, fetchUserApplications]);

  const fetchUserJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/jobs?posted_by_user_id=${userId}&job_type=contractor_internal`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.jobs || []);
      calculateStats(result.jobs || []);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Fetch user jobs error:', error);
      }
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const response = await fetch(
        `/api/jobs/applications?contractor_id=${userId}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch applications');
      }

      setApplications(result.applications || []);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Fetch user applications error:', error);
      }
    }
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

      // Refresh jobs
      await fetchUserJobs();
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Update job status error:', error);
      }
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

      // Refresh jobs
      await fetchUserJobs();
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete job error:', error);
      }
      setError(error instanceof Error ? error.message : 'Failed to delete job');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your internal jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Internal Job Management
          </h1>
          <p className="text-gray-600">
            Manage your internal business opportunities
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Post New Internal Job
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
              <Building className="h-8 w-8 text-orange-600" />
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
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Internal Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
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
                      No internal jobs posted yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 3).map(application => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {application.job?.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Applied{' '}
                          {formatDistanceToNow(
                            new Date(application.created_at),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No applications yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Internal Jobs</CardTitle>
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
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
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
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No internal jobs posted yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by posting your first internal business opportunity
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Internal Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map(application => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.job?.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(
                            new Date(application.created_at),
                            { addSuffix: true }
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No applications yet
                  </h3>
                  <p className="text-gray-600">
                    You haven&apos;t applied to any internal jobs yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
