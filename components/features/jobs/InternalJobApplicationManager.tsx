'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Calendar,
  Phone,
  Mail,
  FileText,
  Download,
  MapPin,
  Globe,
  BadgeCheck,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow, format } from 'date-fns';

interface ApplicationActivity {
  id: string;
  activity_type: 'status_change' | 'message_sent' | 'application_submitted';
  old_value?: string;
  new_value?: string;
  message?: string;
  created_at: string;
  actor?: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface InternalJobApplicationManagerProps {
  jobId: string;
  userId?: string;
  applications?: JobApplicationWithDetails[];
  onApplicationUpdate?: (
    applicationId: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  onApplicationMessage?: (
    applicationId: string,
    message: string
  ) => Promise<void>;
  className?: string;
}

interface ApplicationFilters {
  status: string;
  experience: string;
  rating: string;
}

export function InternalJobApplicationManager({
  jobId,
  userId,
  applications: propApplications,
  onApplicationUpdate: propOnApplicationUpdate,
  onApplicationMessage: propOnApplicationMessage,
  className = '',
}: InternalJobApplicationManagerProps) {
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>(
    propApplications || []
  );
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    experience: 'all',
    rating: 'all',
  });
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [messageSentConfirmation, setMessageSentConfirmation] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activityLog, setActivityLog] = useState<ApplicationActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Fetch applications if not provided as prop
  useEffect(() => {
    console.log(
      '[InternalJobApplicationManager] useEffect - jobId:',
      jobId,
      'propApplications:',
      propApplications?.length || 0
    );

    if (propApplications !== undefined) {
      // Always use prop applications if provided (even if empty array)
      console.log(
        '[InternalJobApplicationManager] Using prop applications:',
        propApplications.length
      );
      setApplications(propApplications);
    } else if (jobId) {
      // Only fetch if no prop applications provided
      console.log(
        '[InternalJobApplicationManager] No prop applications, fetching...'
      );
      fetchApplications();
    }
  }, [jobId, propApplications]);

  const fetchApplications = async () => {
    try {
      setIsLoadingApplications(true);
      console.log(
        '[InternalJobApplicationManager] Fetching applications for job:',
        jobId
      );

      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();
      console.log('[InternalJobApplicationManager] API response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        applicationsCount: result.applications?.length || 0,
      });

      if (!response.ok) {
        console.error('[InternalJobApplicationManager] API error:', result);
        throw new Error(
          result.error || result.message || 'Failed to fetch applications'
        );
      }

      // Handle both success: true and direct applications array
      if (result.success === false) {
        console.error(
          '[InternalJobApplicationManager] API returned success: false:',
          result
        );
        setApplications([]);
        return;
      }

      setApplications(result.applications || []);
      console.log(
        '[InternalJobApplicationManager] Set applications:',
        result.applications?.length || 0
      );
    } catch (error) {
      console.error(
        '[InternalJobApplicationManager] Fetch applications error:',
        error
      );
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const fetchActivity = async (applicationId: string) => {
    try {
      setIsLoadingActivity(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      const response = await fetch(
        `/api/applications/${applicationId}/activity`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        setActivityLog(result.activity || []);
      } else {
        setActivityLog([]);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivityLog([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <Eye className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = (applications || []).filter(application => {
    if (filters.status !== 'all' && application.status !== filters.status) {
      return false;
    }
    if (
      filters.experience !== 'all' &&
      application.contractor?.average_rating
    ) {
      const rating = application.contractor.average_rating;
      if (filters.experience === 'high' && rating < 4.5) return false;
      if (filters.experience === 'medium' && (rating < 3.5 || rating >= 4.5))
        return false;
      if (filters.experience === 'low' && rating >= 3.5) return false;
    }
    return true;
  });

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      setIsLoading(true);
      if (propOnApplicationUpdate) {
        await propOnApplicationUpdate(applicationId, newStatus);
        // Update selectedApplication locally to reflect the change immediately
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication({
            ...selectedApplication,
            status: newStatus as any,
          });
          // Refresh activity log to show the status change
          await fetchActivity(applicationId);
        }
        // Also update in the applications list
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus as any }
              : app
          )
        );
      } else {
        // Default implementation if no handler provided
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to update application');
        }

        // Update selectedApplication locally
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication({
            ...selectedApplication,
            status: newStatus as any,
          });
          // Refresh activity log to show the status change
          await fetchActivity(applicationId);
        }

        // Also update in the applications list
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus as any }
              : app
          )
        );
      }
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update application status:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedApplication || !messageText.trim()) return;

    try {
      setIsLoading(true);
      setMessageSentConfirmation(false);

      // Call the prop handler if provided
      if (propOnApplicationMessage) {
        await propOnApplicationMessage(selectedApplication.id, messageText);
      }

      // Try to log the message activity (non-blocking - don't fail if this doesn't work)
      try {
        const activityHeaders: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (userId) {
          activityHeaders['x-user-id'] = userId;
        }
        await fetch(`/api/applications/${selectedApplication.id}/activity`, {
          method: 'POST',
          headers: activityHeaders,
          credentials: 'include',
          body: JSON.stringify({
            activity_type: 'message_sent',
            message: messageText,
          }),
        });
        // Refresh activity log
        await fetchActivity(selectedApplication.id);
      } catch (activityError) {
        // Activity logging failed, but message was sent - continue
        console.log('Activity logging not available');
      }

      setMessageText('');
      setMessageSentConfirmation(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => {
        setMessageSentConfirmation(false);
      }, 3000);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send message:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAttachment = (attachment: string) => {
    // This would typically download the file
    window.open(attachment, '_blank');
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    reviewed: applications.filter(app => app.status === 'reviewed').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  // Show loading state while fetching applications
  if (isLoadingApplications && applications.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.reviewed}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.accepted}
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
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience-filter">Experience Level</Label>
              <Select
                value={filters.experience}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, experience: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All experience levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High (4.5+ stars)</SelectItem>
                  <SelectItem value="medium">Medium (3.5-4.5 stars)</SelectItem>
                  <SelectItem value="low">Low (Below 3.5 stars)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating-filter">Rating</Label>
              <Select
                value={filters.rating}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, rating: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map(application => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {application.contractor?.profile_photo_url ? (
                            <Image
                              src={application.contractor.profile_photo_url}
                              alt={application.contractor.first_name}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {application.contractor?.first_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {application.contractor?.first_name}{' '}
                            {application.contractor?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {application.contractor?.company_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(application.contractor?.review_count || 0) === 0 ? (
                        <span className="text-sm text-gray-500 italic">
                          No testimonials received
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i <
                                  Math.floor(
                                    application.contractor?.average_rating || 0
                                  )
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({application.contractor?.review_count})
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(application.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog
                          open={
                            detailsDialogOpen &&
                            selectedApplication?.id === application.id
                          }
                          onOpenChange={open => {
                            setDetailsDialogOpen(open);
                            if (open) {
                              setSelectedApplication(application);
                              fetchActivity(application.id);
                            } else {
                              setActivityLog([]);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[98vw] w-[1400px] max-h-[98vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <span>Application Details</span>
                                {selectedApplication && (
                                  <Badge
                                    className={getStatusColor(
                                      selectedApplication.status
                                    )}
                                  >
                                    {getStatusIcon(selectedApplication.status)}
                                    <span className="ml-1">
                                      {selectedApplication.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        selectedApplication.status.slice(1)}
                                    </span>
                                  </Badge>
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <div className="grid grid-cols-3 gap-6 overflow-y-auto max-h-[calc(92vh-80px)]">
                                {/* Left Column - Applicant Details */}
                                <div className="space-y-4 overflow-y-auto">
                                  {/* Company Details */}
                                  <div className="p-3 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="font-medium text-sm flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        Company Details
                                      </Label>
                                      {selectedApplication.contractor
                                        ?.user_id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            window.open(
                                              `/contractors/${selectedApplication.contractor?.user_id}`,
                                              '_blank'
                                            )
                                          }
                                          title="View full profile"
                                        >
                                          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                        </Button>
                                      )}
                                    </div>
                                    {/* Company Logo, Name and Verified */}
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {selectedApplication.contractor
                                          ?.logo_url ? (
                                          <Image
                                            src={
                                              selectedApplication.contractor
                                                .logo_url
                                            }
                                            alt={
                                              selectedApplication.contractor
                                                .company_name ||
                                              selectedApplication.contractor
                                                .first_name
                                            }
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-lg object-cover"
                                          />
                                        ) : (
                                          <Briefcase className="h-6 w-6 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                          <h3 className="font-semibold text-sm truncate">
                                            {selectedApplication.contractor
                                              ?.company_name ||
                                              'Independent Contractor'}
                                          </h3>
                                          {selectedApplication.contractor
                                            ?.is_verified && (
                                            <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                          )}
                                        </div>
                                        {/* Rating inline */}
                                        {(selectedApplication.contractor
                                          ?.review_count || 0) > 0 && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <div className="flex items-center">
                                              {[...Array(5)].map((_, i) => (
                                                <Star
                                                  key={i}
                                                  className={`h-3 w-3 ${
                                                    i <
                                                    Math.floor(
                                                      selectedApplication
                                                        .contractor
                                                        ?.average_rating || 0
                                                    )
                                                      ? 'text-yellow-400 fill-current'
                                                      : 'text-gray-300'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              (
                                              {
                                                selectedApplication.contractor
                                                  ?.review_count
                                              }
                                              )
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {selectedApplication.contractor
                                      ?.company_description && (
                                      <p className="text-xs text-gray-600 line-clamp-3">
                                        {
                                          selectedApplication.contractor
                                            .company_description
                                        }
                                      </p>
                                    )}
                                    {selectedApplication.contractor
                                      ?.company_location && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <MapPin className="h-3 w-3" />
                                        {
                                          selectedApplication.contractor
                                            .company_location
                                        }
                                      </div>
                                    )}
                                    {selectedApplication.contractor
                                      ?.website && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <Globe className="h-3 w-3 text-gray-500" />
                                        <a
                                          href={
                                            selectedApplication.contractor.website.startsWith(
                                              'http'
                                            )
                                              ? selectedApplication.contractor
                                                  .website
                                              : `https://${selectedApplication.contractor.website}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline truncate"
                                        >
                                          {selectedApplication.contractor.website.replace(
                                            /^https?:\/\//,
                                            ''
                                          )}
                                        </a>
                                      </div>
                                    )}
                                    {selectedApplication.contractor
                                      ?.service_categories &&
                                      selectedApplication.contractor
                                        .service_categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {selectedApplication.contractor.service_categories
                                            .slice(0, 3)
                                            .map((cat, i) => (
                                              <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-xs py-0"
                                              >
                                                {cat}
                                              </Badge>
                                            ))}
                                          {selectedApplication.contractor
                                            .service_categories.length > 3 && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs py-0"
                                            >
                                              +
                                              {selectedApplication.contractor
                                                .service_categories.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                  </div>

                                  {/* Personal/Contact Details */}
                                  <div className="p-3 border rounded-lg space-y-3">
                                    <Label className="font-medium text-sm flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      Applicant Details
                                    </Label>
                                    {/* Applicant Photo and Name */}
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        {selectedApplication.contractor
                                          ?.avatar_url ? (
                                          <Image
                                            src={
                                              selectedApplication.contractor
                                                .avatar_url
                                            }
                                            alt={
                                              selectedApplication.contractor
                                                .first_name || 'Applicant'
                                            }
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-sm font-medium text-gray-500">
                                            {selectedApplication.contractor?.first_name?.charAt(
                                              0
                                            ) || '?'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-gray-800">
                                        {
                                          selectedApplication.contractor
                                            ?.first_name
                                        }{' '}
                                        {
                                          selectedApplication.contractor
                                            ?.last_name
                                        }
                                      </p>
                                    </div>
                                    {selectedApplication.contractor?.phone && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Phone className="h-3 w-3" />
                                        {selectedApplication.contractor.phone}
                                      </div>
                                    )}
                                    {selectedApplication.contractor
                                      ?.user_location && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <MapPin className="h-3 w-3" />
                                        {
                                          selectedApplication.contractor
                                            .user_location
                                        }
                                      </div>
                                    )}
                                    {selectedApplication.contractor?.bio && (
                                      <p className="text-xs text-gray-600 line-clamp-3 italic">
                                        &ldquo;
                                        {selectedApplication.contractor.bio}
                                        &rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Middle Column - Application Content */}
                                <div className="space-y-4">
                                  {/* Application Message */}
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <Label className="font-medium">
                                        Application Message
                                      </Label>
                                      <span className="text-xs text-gray-500">
                                        Applied{' '}
                                        {format(
                                          new Date(
                                            selectedApplication.created_at
                                          ),
                                          'MMM d, yyyy h:mm a'
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                                      {selectedApplication.application_message}
                                    </p>
                                  </div>

                                  {/* Attachments */}
                                  {selectedApplication.attachments &&
                                    selectedApplication.attachments.length >
                                      0 && (
                                      <div>
                                        <Label className="font-medium">
                                          Attachments
                                        </Label>
                                        <div className="mt-2 space-y-1">
                                          {selectedApplication.attachments.map(
                                            (
                                              attachment: string,
                                              index: number
                                            ) => {
                                              const isImage =
                                                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                                                  attachment
                                                );
                                              const isPdf = /\.pdf$/i.test(
                                                attachment
                                              );
                                              return (
                                                <div
                                                  key={index}
                                                  className="flex items-center space-x-2 group relative"
                                                >
                                                  <FileText className="h-4 w-4 text-gray-500" />
                                                  <a
                                                    href={attachment}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[150px]"
                                                  >
                                                    {attachment
                                                      .split('/')
                                                      .pop() || attachment}
                                                  </a>
                                                  {isImage && (
                                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                                                        <img
                                                          src={attachment}
                                                          alt="Preview"
                                                          className="max-w-[200px] max-h-[200px] object-contain rounded"
                                                        />
                                                      </div>
                                                    </div>
                                                  )}
                                                  {isPdf && (
                                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                                                        <iframe
                                                          src={attachment}
                                                          title="PDF Preview"
                                                          className="w-[300px] h-[400px] rounded"
                                                        />
                                                      </div>
                                                    </div>
                                                  )}
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleDownloadAttachment(
                                                        attachment
                                                      )
                                                    }
                                                  >
                                                    <Download className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Proposed Budget */}
                                  {selectedApplication.proposed_budget && (
                                    <div>
                                      <Label className="font-medium">
                                        Proposed Budget
                                      </Label>
                                      <p className="text-sm text-gray-700 mt-1">
                                        $
                                        {selectedApplication.proposed_budget.toLocaleString()}
                                      </p>
                                    </div>
                                  )}

                                  {/* Availability */}
                                  {(selectedApplication.availability_start_date ||
                                    selectedApplication.availability_end_date) && (
                                    <div>
                                      <Label className="font-medium">
                                        Availability
                                      </Label>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {selectedApplication.availability_start_date && (
                                          <span>
                                            From:{' '}
                                            {new Date(
                                              selectedApplication.availability_start_date
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                        {selectedApplication.availability_start_date &&
                                          selectedApplication.availability_end_date &&
                                          ' - '}
                                        {selectedApplication.availability_end_date && (
                                          <span>
                                            To:{' '}
                                            {new Date(
                                              selectedApplication.availability_end_date
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Right Column - Activity & Actions */}
                                <div className="flex flex-col gap-4">
                                  {/* Activity Log */}
                                  <div>
                                    <Label className="font-medium">
                                      Activity Log
                                    </Label>
                                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                                      {isLoadingActivity ? (
                                        <div className="p-3 text-center text-sm text-gray-500">
                                          Loading activity...
                                        </div>
                                      ) : activityLog.length === 0 ? (
                                        <div className="p-3 text-center text-sm text-gray-500">
                                          No activity yet
                                        </div>
                                      ) : (
                                        <div className="divide-y">
                                          {activityLog.map(activity => (
                                            <div
                                              key={activity.id}
                                              className="p-2 text-xs"
                                            >
                                              {activity.activity_type ===
                                              'message_sent' ? (
                                                <div>
                                                  <div className="flex items-start justify-between">
                                                    <p className="text-gray-700">
                                                      <span className="font-medium">
                                                        {activity.actor
                                                          ?.profiles
                                                          ?.first_name ||
                                                          'User'}
                                                      </span>{' '}
                                                      sent a message:
                                                    </p>
                                                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                      {format(
                                                        new Date(
                                                          activity.created_at
                                                        ),
                                                        'MMM d, h:mm a'
                                                      )}
                                                    </span>
                                                  </div>
                                                  <p className="mt-1 text-gray-600 italic bg-gray-50 p-1 rounded text-xs whitespace-pre-wrap">
                                                    {activity.message}
                                                  </p>
                                                </div>
                                              ) : (
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    {activity.activity_type ===
                                                      'status_change' && (
                                                      <p className="text-gray-700">
                                                        <span className="font-medium">
                                                          {activity.actor
                                                            ?.profiles
                                                            ?.first_name ||
                                                            'User'}
                                                        </span>{' '}
                                                        changed status from{' '}
                                                        <Badge
                                                          className={`${getStatusColor(activity.old_value || '')} text-xs`}
                                                        >
                                                          {activity.old_value}
                                                        </Badge>{' '}
                                                        to{' '}
                                                        <Badge
                                                          className={`${getStatusColor(activity.new_value || '')} text-xs`}
                                                        >
                                                          {activity.new_value}
                                                        </Badge>
                                                      </p>
                                                    )}
                                                    {activity.activity_type ===
                                                      'application_submitted' && (
                                                      <p className="text-gray-700">
                                                        Application submitted
                                                      </p>
                                                    )}
                                                  </div>
                                                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                    {format(
                                                      new Date(
                                                        activity.created_at
                                                      ),
                                                      'MMM d, h:mm a'
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Message */}
                                  <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <Label className="font-medium">
                                        Send Message
                                      </Label>
                                      <Select
                                        value={selectedApplication.status}
                                        onValueChange={value =>
                                          handleStatusUpdate(
                                            selectedApplication.id,
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-auto h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem
                                            value="pending"
                                            className="py-2"
                                          >
                                            <Badge
                                              className={getStatusColor(
                                                'pending'
                                              )}
                                            >
                                              <Clock className="h-4 w-4" />
                                              <span className="ml-1">
                                                Pending
                                              </span>
                                            </Badge>
                                          </SelectItem>
                                          <SelectItem
                                            value="reviewed"
                                            className="py-2"
                                          >
                                            <Badge
                                              className={getStatusColor(
                                                'reviewed'
                                              )}
                                            >
                                              <Eye className="h-4 w-4" />
                                              <span className="ml-1">
                                                Reviewed
                                              </span>
                                            </Badge>
                                          </SelectItem>
                                          <SelectItem
                                            value="accepted"
                                            className="py-2"
                                          >
                                            <Badge
                                              className={getStatusColor(
                                                'accepted'
                                              )}
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                              <span className="ml-1">
                                                Accepted
                                              </span>
                                            </Badge>
                                          </SelectItem>
                                          <SelectItem
                                            value="rejected"
                                            className="py-2"
                                          >
                                            <Badge
                                              className={getStatusColor(
                                                'rejected'
                                              )}
                                            >
                                              <XCircle className="h-4 w-4" />
                                              <span className="ml-1">
                                                Rejected
                                              </span>
                                            </Badge>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                                      <Textarea
                                        value={messageText}
                                        onChange={e =>
                                          setMessageText(e.target.value)
                                        }
                                        placeholder="Type your message here..."
                                        className="text-sm flex-1 min-h-[120px] resize-none"
                                      />
                                      <Button
                                        onClick={handleSendMessage}
                                        disabled={
                                          !messageText.trim() || isLoading
                                        }
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                        size="sm"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Send Message
                                      </Button>
                                      {messageSentConfirmation && (
                                        <span className="text-xs text-green-600 flex items-center justify-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Message sent successfully
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications found
              </h3>
              <p className="text-gray-600">
                {applications.length === 0
                  ? 'No applications have been submitted yet'
                  : 'No applications match your current filters'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
