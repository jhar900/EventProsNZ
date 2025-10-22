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
} from 'lucide-react';
import { JobApplicationWithDetails } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface InternalJobApplicationManagerProps {
  jobId: string;
  applications: JobApplicationWithDetails[];
  onApplicationUpdate: (
    applicationId: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  onApplicationMessage: (
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
  applications,
  onApplicationUpdate,
  onApplicationMessage,
  className = '',
}: InternalJobApplicationManagerProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationWithDetails | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    experience: 'all',
    rating: 'all',
  });
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const filteredApplications = applications.filter(application => {
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
      await onApplicationUpdate(applicationId, newStatus);
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
      await onApplicationMessage(selectedApplication.id, messageText);
      setMessageText('');
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
                          ({application.contractor?.review_count || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(application.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedApplication(application)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <div className="space-y-4">
                                {/* Contractor Info */}
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                    {selectedApplication.contractor
                                      ?.profile_photo_url ? (
                                      <Image
                                        src={
                                          selectedApplication.contractor
                                            .profile_photo_url
                                        }
                                        alt={
                                          selectedApplication.contractor
                                            .first_name
                                        }
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full"
                                      />
                                    ) : (
                                      <span className="text-lg font-medium">
                                        {selectedApplication.contractor?.first_name?.charAt(
                                          0
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">
                                      {
                                        selectedApplication.contractor
                                          ?.first_name
                                      }{' '}
                                      {
                                        selectedApplication.contractor
                                          ?.last_name
                                      }
                                    </h3>
                                    <p className="text-gray-600">
                                      {
                                        selectedApplication.contractor
                                          ?.company_name
                                      }
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i <
                                              Math.floor(
                                                selectedApplication.contractor
                                                  ?.average_rating || 0
                                              )
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        (
                                        {selectedApplication.contractor
                                          ?.review_count || 0}{' '}
                                        reviews)
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Cover Letter */}
                                <div>
                                  <Label className="font-medium">
                                    Cover Letter
                                  </Label>
                                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded">
                                    {selectedApplication.cover_letter}
                                  </p>
                                </div>

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

                                {/* Attachments */}
                                {selectedApplication.attachments &&
                                  selectedApplication.attachments.length >
                                    0 && (
                                    <div>
                                      <Label className="font-medium">
                                        Attachments
                                      </Label>
                                      <div className="mt-2 space-y-2">
                                        {selectedApplication.attachments.map(
                                          (attachment, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center space-x-2"
                                            >
                                              <FileText className="h-4 w-4 text-gray-500" />
                                              <span className="text-sm text-gray-700">
                                                {attachment}
                                              </span>
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
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Status Update */}
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1">
                                    <Label className="font-medium">
                                      Update Status
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
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="reviewed">
                                          Reviewed
                                        </SelectItem>
                                        <SelectItem value="accepted">
                                          Accepted
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                          Rejected
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Message */}
                                <div>
                                  <Label className="font-medium">
                                    Send Message
                                  </Label>
                                  <div className="mt-2 space-y-2">
                                    <Textarea
                                      value={messageText}
                                      onChange={e =>
                                        setMessageText(e.target.value)
                                      }
                                      placeholder="Type your message here..."
                                      rows={3}
                                    />
                                    <Button
                                      onClick={handleSendMessage}
                                      disabled={
                                        !messageText.trim() || isLoading
                                      }
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
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
