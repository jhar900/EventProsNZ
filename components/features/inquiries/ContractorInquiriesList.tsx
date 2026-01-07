'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Clock,
  Eye,
  Mail,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Inquiry } from '@/types/inquiries';
import { InquiryDetailDialog } from './InquiryDetailDialog';
import { QuickResponseDialog } from './QuickResponseDialog';

interface ContractorInquiriesListProps {
  className?: string;
  compact?: boolean;
}

export interface InquiryWithRelations extends Inquiry {
  event_manager?: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
  event?: {
    id: string;
    title: string;
    event_type?: string;
    event_date?: string;
    location?: string;
  };
}

export default function ContractorInquiriesList({
  className = '',
  compact = false,
}: ContractorInquiriesListProps) {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryWithRelations | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseInquiryId, setResponseInquiryId] = useState<string>('');
  const [responseInquirySubject, setResponseInquirySubject] =
    useState<string>('');

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchInquiries = async (preserveSelectedInquiry = false) => {
    try {
      // Preserve the selected inquiry ID if modal is open
      const selectedInquiryId =
        preserveSelectedInquiry && selectedInquiry?.id
          ? selectedInquiry.id
          : null;

      // Only show loading if modal is not open (to avoid closing modal)
      if (!preserveSelectedInquiry) {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      const headers: HeadersInit = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/inquiries?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include', // Ensure cookies are sent
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMsg = data.message || 'Failed to fetch inquiries';
        const errorDetails = data.error || data.details || JSON.stringify(data);
        const fullError =
          errorDetails && errorDetails !== '{}'
            ? `${errorMsg}: ${errorDetails}`
            : errorMsg;
        console.error('Inquiries fetch error - Full response:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMsg,
          error: data.error,
          details: data.details,
          fullResponse: JSON.stringify(data, null, 2),
        });
        throw new Error(fullError);
      }

      const updatedInquiries = data.inquiries || [];
      setInquiries(updatedInquiries);

      // If we're preserving the selected inquiry, find it in the updated list
      if (preserveSelectedInquiry && selectedInquiryId) {
        const updatedInquiry = updatedInquiries.find(
          (inq: InquiryWithRelations) => inq.id === selectedInquiryId
        );
        if (updatedInquiry) {
          // Update the selected inquiry with fresh data, but don't close the modal
          setSelectedInquiry(updatedInquiry);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort inquiries
  const filteredAndSortedInquiries = useMemo(() => {
    let filtered = [...inquiries];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        inquiry =>
          inquiry.subject.toLowerCase().includes(query) ||
          inquiry.message.toLowerCase().includes(query) ||
          (inquiry.event_manager as any)?.email
            ?.toLowerCase()
            .includes(query) ||
          (inquiry.event_manager as any)?.profiles?.first_name
            ?.toLowerCase()
            .includes(query) ||
          (inquiry.event_manager as any)?.profiles?.last_name
            ?.toLowerCase()
            .includes(query) ||
          inquiry.event?.title?.toLowerCase().includes(query)
      );
    }

    // Apply sorting - always newest first
    filtered.sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return filtered;
  }, [inquiries, searchQuery]);

  const handleViewDetails = (inquiry: InquiryWithRelations) => {
    setSelectedInquiry(inquiry);
    setIsDetailDialogOpen(true);
  };

  const handleRespond = (inquiry: InquiryWithRelations) => {
    setResponseInquiryId(inquiry.id);
    setResponseInquirySubject(inquiry.subject);
    setIsResponseDialogOpen(true);
  };

  const [responseSentTrigger, setResponseSentTrigger] = useState(0);

  const handleResponseSuccess = () => {
    fetchInquiries(); // Refresh the list
    setResponseSentTrigger(prev => prev + 1); // Trigger detail dialog refresh
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'quoted':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-semibold">Failed to fetch inquiries</p>
          </div>
          <div className="ml-7">
            <p className="text-sm text-gray-700">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              Please check the browser console for more details, or contact
              support if the issue persists.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Search inquiries by subject, message, or sender..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 border-0 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none focus:bg-gray-100"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filteredAndSortedInquiries.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {inquiries.length === 0
              ? 'No Inquiries Yet'
              : 'No Inquiries Match Your Filters'}
          </h3>
          <p className="text-gray-600">
            {inquiries.length === 0
              ? "You haven't received any inquiries yet. When event managers contact you, they'll appear here."
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </Card>
      ) : (
        <div className={compact ? 'space-y-2' : 'space-y-4'}>
          {filteredAndSortedInquiries.map(inquiry => {
            const eventManager = inquiry.event_manager as any;
            const profile = eventManager?.profiles;
            // Build name from profile, fallback to email, then 'Unknown'
            let managerName = 'Unknown';
            if (profile && (profile.first_name || profile.last_name)) {
              const fullName =
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              managerName = fullName || eventManager?.email || 'Unknown';
            } else if (
              eventManager?.email &&
              eventManager.email !== 'Unknown'
            ) {
              managerName = eventManager.email;
            }

            return (
              <Card
                key={inquiry.id}
                className={
                  compact
                    ? 'p-3 hover:shadow-md transition-shadow'
                    : 'p-6 hover:shadow-md transition-shadow'
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className={`flex items-start space-x-3 ${compact ? 'mb-2' : 'mb-4'}`}
                    >
                      <Avatar className={compact ? 'h-8 w-8' : 'h-12 w-12'}>
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {managerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div
                          className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-2'}`}
                        >
                          <h3
                            className={
                              compact
                                ? 'text-base font-semibold text-gray-900'
                                : 'text-lg font-semibold text-gray-900'
                            }
                          >
                            {inquiry.subject}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                          </div>
                        </div>
                        <div
                          className={`flex items-center space-x-4 text-xs text-gray-600 ${compact ? 'mb-1' : 'mb-3'}`}
                        >
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{managerName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(inquiry.created_at)}</span>
                          </div>
                          {inquiry.event && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{inquiry.event.title}</span>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-gray-700 ${compact ? 'mb-2 line-clamp-2 text-sm' : 'mb-4 line-clamp-3'}`}
                        >
                          {inquiry.message}
                        </p>
                        {inquiry.event && inquiry.event.event_date && (
                          <div
                            className={`flex items-center text-xs text-gray-600 ${compact ? 'mb-1' : 'mb-2'}`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              Event Date:{' '}
                              {new Date(
                                inquiry.event.event_date
                              ).toLocaleDateString('en-NZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center justify-end space-x-2 ${compact ? 'mt-2 pt-2' : 'mt-4 pt-4'} border-t border-gray-200`}
                >
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'sm'}
                    onClick={() => handleViewDetails(inquiry)}
                    className={compact ? 'h-7 text-xs px-2' : ''}
                  >
                    <Eye
                      className={compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}
                    />
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <InquiryDetailDialog
        inquiry={selectedInquiry}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedInquiry(null);
        }}
        onResponseSent={responseSentTrigger}
        onResponseSubmitted={() => {
          // Refresh the inquiries list when a response is submitted
          // Pass true to preserve the selected inquiry so modal stays open
          fetchInquiries(true);
        }}
      />

      <QuickResponseDialog
        inquiryId={responseInquiryId}
        inquirySubject={responseInquirySubject}
        isOpen={isResponseDialogOpen}
        onClose={() => {
          setIsResponseDialogOpen(false);
          setResponseInquiryId('');
          setResponseInquirySubject('');
        }}
        onSuccess={handleResponseSuccess}
      />
    </div>
  );
}
