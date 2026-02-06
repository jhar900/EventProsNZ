'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  User,
  FileText,
  Briefcase,
  Download,
  Building2,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { JobApplicationWithDetails, JobWithDetails } from '@/types/jobs';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
      avatar_url?: string;
    };
  };
}

interface ApplicantApplicationModalProps {
  application: JobApplicationWithDetails | null;
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function ApplicantApplicationModal({
  application,
  open,
  onClose,
  userId,
}: ApplicantApplicationModalProps) {
  const [jobDetails, setJobDetails] = useState<JobWithDetails | null>(null);
  const [activityLog, setActivityLog] = useState<ApplicationActivity[]>([]);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isCompanyBioExpanded, setIsCompanyBioExpanded] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentConfirmation, setMessageSentConfirmation] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && application?.job?.id) {
      fetchJobDetails(application.job.id);
      fetchActivity(application.id);
      setIsCompanyBioExpanded(false);
      setMessageText('');
      setMessageSentConfirmation(false);
    }
  }, [open, application]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setIsLoadingJob(true);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setJobDetails(result.job);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setIsLoadingJob(false);
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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !application) return;

    try {
      setIsSendingMessage(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(
        `/api/applications/${application.id}/activity`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            activity_type: 'message_sent',
            message: messageText.trim(),
          }),
        }
      );

      if (response.ok) {
        setMessageText('');
        setMessageSentConfirmation(true);
        setTimeout(() => setMessageSentConfirmation(false), 3000);
        await fetchActivity(application.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadAttachment = (attachment: string) => {
    window.open(attachment, '_blank');
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[1400px] max-h-[98vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Application Details</span>
            <Badge className={getStatusColor(application.status)}>
              {getStatusIcon(application.status)}
              <span className="ml-1">
                {application.status.charAt(0).toUpperCase() +
                  application.status.slice(1)}
              </span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Left Column - Job Details & Owner */}
          <div className="space-y-4 overflow-y-auto">
            {isLoadingJob ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <>
                {/* Job Details */}
                <div className="p-3 border rounded-lg space-y-3">
                  <Label className="font-medium text-sm flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Job Details
                  </Label>
                  <h3 className="font-semibold text-lg">
                    {jobDetails?.title || application.job?.title || 'Job Title'}
                  </h3>
                  {jobDetails?.description && (
                    <p className="text-sm text-gray-600 line-clamp-6">
                      {jobDetails.description}
                    </p>
                  )}
                  {jobDetails?.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{jobDetails.location}</span>
                      {jobDetails.is_remote && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Remote OK
                        </Badge>
                      )}
                    </div>
                  )}
                  {(jobDetails?.budget_range_min ||
                    jobDetails?.budget_range_max) && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {jobDetails.budget_range_min &&
                          formatCurrency(jobDetails.budget_range_min)}
                        {jobDetails.budget_range_min &&
                          jobDetails.budget_range_max &&
                          ' - '}
                        {jobDetails.budget_range_max &&
                          formatCurrency(jobDetails.budget_range_max)}
                      </span>
                    </div>
                  )}
                  {(jobDetails?.timeline_start_date ||
                    jobDetails?.timeline_end_date) && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {jobDetails.timeline_start_date &&
                          format(
                            new Date(jobDetails.timeline_start_date),
                            'MMM d, yyyy'
                          )}
                        {jobDetails.timeline_start_date &&
                          jobDetails.timeline_end_date &&
                          ' - '}
                        {jobDetails.timeline_end_date &&
                          format(
                            new Date(jobDetails.timeline_end_date),
                            'MMM d, yyyy'
                          )}
                      </span>
                    </div>
                  )}
                  {jobDetails?.service_category && (
                    <Badge variant="secondary" className="text-xs">
                      {jobDetails.service_category.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>

                {/* Job Owner Details */}
                {jobDetails?.posted_by_user?.profiles &&
                  (() => {
                    const profile = Array.isArray(
                      jobDetails.posted_by_user.profiles
                    )
                      ? jobDetails.posted_by_user.profiles[0]
                      : jobDetails.posted_by_user.profiles;
                    if (!profile) return null;
                    return (
                      <div className="p-3 border rounded-lg space-y-3">
                        <Label className="font-medium text-sm flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Posted By
                        </Label>
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage
                              src={profile.avatar_url || ''}
                              alt={profile.first_name || 'User'}
                            />
                            <AvatarFallback className="bg-gray-200">
                              <User className="w-5 h-5 text-gray-500" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {profile.first_name} {profile.last_name}
                            </p>
                            {profile.bio && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                {profile.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Company Details */}
                {jobDetails?.posted_by_user?.business_profiles?.[0]
                  ?.company_name && (
                  <div className="p-3 border rounded-lg space-y-3">
                    <Label className="font-medium text-sm flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Company
                    </Label>
                    <div className="flex items-start gap-3">
                      {jobDetails.posted_by_user.business_profiles[0]
                        .logo_url && (
                        <img
                          src={
                            jobDetails.posted_by_user.business_profiles[0]
                              .logo_url
                          }
                          alt={
                            jobDetails.posted_by_user.business_profiles[0]
                              .company_name
                          }
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-800">
                          {
                            jobDetails.posted_by_user.business_profiles[0]
                              .company_name
                          }
                        </p>
                        {jobDetails.posted_by_user.business_profiles[0]
                          .location && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {
                                jobDetails.posted_by_user.business_profiles[0]
                                  .location
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {jobDetails.posted_by_user.business_profiles[0]
                      .description && (
                      <p
                        className={`text-sm text-gray-600 cursor-pointer hover:text-gray-800 ${
                          isCompanyBioExpanded ? '' : 'line-clamp-4'
                        }`}
                        onClick={() =>
                          setIsCompanyBioExpanded(!isCompanyBioExpanded)
                        }
                        title={
                          isCompanyBioExpanded
                            ? 'Click to collapse'
                            : 'Click to expand'
                        }
                      >
                        {
                          jobDetails.posted_by_user.business_profiles[0]
                            .description
                        }
                      </p>
                    )}
                    {jobDetails.posted_by_user.business_profiles[0].website && (
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={
                            jobDetails.posted_by_user.business_profiles[0]
                              .website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                        >
                          {jobDetails.posted_by_user.business_profiles[0].website.replace(
                            /^https?:\/\//,
                            ''
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Requirements */}
                {jobDetails?.special_requirements && (
                  <div className="p-3 border rounded-lg space-y-2">
                    <Label className="font-medium text-sm">
                      Special Requirements
                    </Label>
                    <p className="text-sm text-gray-600">
                      {jobDetails.special_requirements}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Middle Column - My Application */}
          <div className="space-y-4">
            {/* Application Message */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="font-medium">My Application</Label>
                <span className="text-xs text-gray-500">
                  Submitted{' '}
                  {format(
                    new Date(application.created_at),
                    'MMM d, yyyy h:mm a'
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded max-h-60 overflow-y-auto whitespace-pre-wrap">
                {application.application_message}
              </p>
            </div>

            {/* Proposed Budget */}
            {application.proposed_budget && (
              <div>
                <Label className="font-medium">Proposed Budget</Label>
                <p className="text-sm text-gray-700 mt-1">
                  {formatCurrency(application.proposed_budget)}
                </p>
              </div>
            )}

            {/* Availability */}
            {(application.availability_start_date ||
              application.availability_end_date) && (
              <div>
                <Label className="font-medium">My Availability</Label>
                <p className="text-sm text-gray-700 mt-1">
                  {application.availability_start_date && (
                    <span>
                      From:{' '}
                      {format(
                        new Date(application.availability_start_date),
                        'MMM d, yyyy'
                      )}
                    </span>
                  )}
                  {application.availability_start_date &&
                    application.availability_end_date &&
                    ' - '}
                  {application.availability_end_date && (
                    <span>
                      To:{' '}
                      {format(
                        new Date(application.availability_end_date),
                        'MMM d, yyyy'
                      )}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Attachments */}
            {application.attachments && application.attachments.length > 0 && (
              <div>
                <Label className="font-medium">Attachments</Label>
                <div className="mt-2 space-y-1">
                  {application.attachments.map(
                    (attachment: string, index: number) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                        attachment
                      );
                      const isPdf = /\.pdf$/i.test(attachment);
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
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                          >
                            {attachment.split('/').pop() || attachment}
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
                            onClick={() => handleDownloadAttachment(attachment)}
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
          </div>

          {/* Right Column - Messages */}
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Label className="font-medium">Messages</Label>
              <div
                ref={messagesContainerRef}
                className="mt-2 h-[calc(100%-2rem)] overflow-y-auto"
              >
                {isLoadingActivity ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Loading messages...
                  </div>
                ) : activityLog.filter(a => a.activity_type === 'message_sent')
                    .length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  <div>
                    {activityLog
                      .filter(
                        activity => activity.activity_type === 'message_sent'
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                      )
                      .map(activity => (
                        <div key={activity.id} className="p-2 text-xs">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 flex-shrink-0">
                                  <AvatarImage
                                    src={
                                      activity.actor?.profiles?.avatar_url || ''
                                    }
                                    alt={
                                      activity.actor?.profiles?.first_name ||
                                      'User'
                                    }
                                  />
                                  <AvatarFallback className="bg-gray-200">
                                    <User className="w-3 h-3 text-gray-500" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-700">
                                  {activity.actor?.profiles?.first_name ||
                                    'User'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                {format(
                                  new Date(activity.created_at),
                                  'MMM d, h:mm a'
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap">
                              {activity.message}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Input - only show when status is not pending */}
            {application.status !== 'pending' && (
              <div className="border-t pt-3">
                <Label className="font-medium text-sm">Send Message</Label>
                <div className="mt-2 flex flex-col gap-2">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    className="text-sm min-h-[100px] resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                  </Button>
                  {messageSentConfirmation && (
                    <span className="text-xs text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Message sent successfully
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
