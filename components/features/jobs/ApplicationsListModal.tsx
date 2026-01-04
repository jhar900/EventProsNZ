'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  id: string;
  job_id: string;
  contractor_id: string;
  application_message: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  attachments?: string[] | null;
  proposed_budget?: number | null;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    user_id: string;
    profile?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      avatar_url?: string | null;
    };
  };
}

interface ApplicationsListModalProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function ApplicationsListModal({
  jobId,
  jobTitle,
  open,
  onClose,
  userId,
}: ApplicationsListModalProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && jobId) {
      fetchApplications();
    }
  }, [open, jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add user ID header if available
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(`/api/jobs/${jobId}/applications-list`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch applications: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setApplications(data.applications || []);
      } else {
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error(
        '[ApplicationsListModal] Error fetching applications:',
        err
      );
      setError(
        err instanceof Error ? err.message : 'Failed to fetch applications'
      );
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applications for: {jobTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading applications...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No applications found for this job.
              </p>
            </div>
          )}

          {!loading && !error && applications.length > 0 && (
            <div className="space-y-4">
              {applications.map(application => (
                <Card key={application.id} className="p-6">
                  <div className="space-y-4">
                    {/* Header with contractor info and status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {application.contractor?.profile?.avatar_url ? (
                          <img
                            src={application.contractor.profile.avatar_url}
                            alt={`${application.contractor.profile.first_name} ${application.contractor.profile.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">
                              {application.contractor?.profile?.first_name}{' '}
                              {application.contractor?.profile?.last_name}
                            </h3>
                            <Badge
                              className={getStatusColor(application.status)}
                            >
                              {getStatusLabel(application.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {application.contractor?.company_name && (
                              <div className="flex items-center space-x-1">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                <span>
                                  {application.contractor.company_name}
                                </span>
                              </div>
                            )}
                            {application.contractor?.profile?.email && (
                              <div className="flex items-center space-x-1">
                                <EnvelopeIcon className="h-4 w-4" />
                                <span>
                                  {application.contractor.profile.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(
                              new Date(application.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Application message */}
                    {application.application_message && (
                      <div className="pt-4 border-t">
                        <div className="flex items-start space-x-2">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                              Application Message
                            </h4>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {application.application_message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proposed budget */}
                    {application.proposed_budget && (
                      <div className="pt-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">
                            Proposed Budget:{' '}
                          </span>
                          <span className="text-gray-600">
                            {formatCurrency(application.proposed_budget)}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Attachments */}
                    {application.attachments &&
                      Array.isArray(application.attachments) &&
                      application.attachments.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-start space-x-2">
                            <PaperClipIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-700 mb-2">
                                Attachments ({application.attachments.length})
                              </h4>
                              <div className="space-y-1">
                                {application.attachments.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-blue-600 hover:text-blue-800 underline truncate"
                                  >
                                    {url.split('/').pop() ||
                                      `Attachment ${index + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
