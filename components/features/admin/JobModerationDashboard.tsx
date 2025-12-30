'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  Search,
  Filter,
  RefreshCw,
  Star,
  Clock,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  event_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  quality_score: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  applications_count: number;
  views_count: number;
  flags: Array<{
    id: string;
    reason: string;
    flagged_by: string;
    flagged_at: string;
  }>;
}

interface ModerationFilters {
  status: string;
  quality_score_min: number;
  category: string;
  urgency: string;
  search: string;
}

export default function JobModerationDashboard() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationComment, setModerationComment] = useState('');
  const [filters, setFilters] = useState<ModerationFilters>({
    status: 'all',
    quality_score_min: 0,
    category: 'all',
    urgency: 'all',
    search: '',
  });

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/jobs/moderation');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load jobs:', response.status, errorData);
        setJobs([]);
        setFilteredJobs([]);
        return;
      }

      const data = await response.json();
      console.log('Jobs loaded:', data);
      const jobsList = data.jobs || [];
      console.log('Jobs count:', jobsList.length);
      setJobs(jobsList);
      setFilteredJobs(jobsList);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    if (filters.status !== 'all') {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    if (filters.quality_score_min > 0) {
      filtered = filtered.filter(
        job => job.quality_score >= filters.quality_score_min
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(job => job.urgency === filters.urgency);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower) ||
          job.user_name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, filters]);

  const moderateJob = async (jobId: string, action: 'approve' | 'reject') => {
    try {
      setIsModerating(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: moderationComment,
        }),
      });

      if (response.ok) {
        await loadJobs();
        setSelectedJob(null);
        setModerationComment('');
      }
    } catch (error) {
      // Error handled
    } finally {
      setIsModerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Medium
          </Badge>
        );
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{urgency}</Badge>;
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading job moderation dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job Moderation Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and moderate job postings for quality and compliance
          </p>
        </div>
        <Button onClick={loadJobs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter job postings for review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Quality Score</label>
              <Select
                value={filters.quality_score_min.toString()}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    quality_score_min: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                  <SelectItem value="60">60+</SelectItem>
                  <SelectItem value="70">70+</SelectItem>
                  <SelectItem value="80">80+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="decorations">Decorations</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Urgency</label>
              <Select
                value={filters.urgency}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, urgency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle>Job Postings ({filteredJobs.length})</CardTitle>
          <CardDescription>
            Review and moderate job postings for quality and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.category} •{' '}
                        {new Date(job.event_date).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                  </TableCell>
                  <TableCell>${job.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div
                      className={`font-medium ${getQualityScoreColor(job.quality_score)}`}
                    >
                      {job.quality_score}/100
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>{getUrgencyBadge(job.urgency)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {job.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderateJob(job.id, 'approve')}
                            disabled={isModerating}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderateJob(job.id, 'reject')}
                            disabled={isModerating}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Detail Modal */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Review job posting details for moderation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium">Job Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Title:</strong> {selectedJob.title}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedJob.category}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedJob.location}
                  </div>
                  <div>
                    <strong>Budget:</strong> $
                    {selectedJob.budget.toLocaleString()}
                  </div>
                  <div>
                    <strong>Event Date:</strong>{' '}
                    {new Date(selectedJob.event_date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Quality Score:</strong>{' '}
                    <span
                      className={getQualityScoreColor(
                        selectedJob.quality_score
                      )}
                    >
                      {selectedJob.quality_score}/100
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium">User Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedJob.user_name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedJob.user_email}
                  </div>
                  <div>
                    <strong>Posted:</strong>{' '}
                    {new Date(selectedJob.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Applications:</strong>{' '}
                    {selectedJob.applications_count}
                  </div>
                  <div>
                    <strong>Views:</strong> {selectedJob.views_count}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Description</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                {selectedJob.description}
              </div>
            </div>

            {selectedJob.flags.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600">Flags</h3>
                <div className="space-y-2">
                  {selectedJob.flags.map(flag => (
                    <div
                      key={flag.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="text-sm">
                        <strong>Reason:</strong> {flag.reason}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Flagged by {flag.flagged_by} on{' '}
                        {new Date(flag.flagged_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium">Moderation Comment</h3>
              <Textarea
                placeholder="Add moderation comment..."
                value={moderationComment}
                onChange={e => setModerationComment(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              {selectedJob.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => moderateJob(selectedJob.id, 'approve')}
                    disabled={isModerating}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => moderateJob(selectedJob.id, 'reject')}
                    disabled={isModerating}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
