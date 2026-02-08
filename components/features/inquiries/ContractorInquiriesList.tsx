'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Calendar,
  MapPin,
  Mail,
  AlertCircle,
  Search,
  ArrowLeft,
  Building2,
  Phone,
  Send,
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Inquiry, RESPONSE_TYPES } from '@/types/inquiries';

// Local type for message responses
interface MessageResponse {
  id: string;
  inquiry_id: string;
  responder_id: string;
  response_type: string;
  message: string;
  is_template: boolean;
  created_at: string;
  responder?: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface InquiryDetailData {
  inquiry: Inquiry;
  responses: MessageResponse[];
  success: boolean;
}

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
      company_name?: string;
      phone?: string;
    };
    published_profile_id?: string | null;
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

  // Detail panel state
  const [detailData, setDetailData] = useState<InquiryDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );
  const [newResponse, setNewResponse] = useState('');
  const [responseType, setResponseType] = useState<string>('reply');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch inquiry details when an inquiry is selected
  useEffect(() => {
    if (selectedInquiry) {
      fetchInquiryDetails();
    } else {
      setDetailData(null);
      setDetailError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInquiry?.id]);

  // Scroll to bottom when detail data loads
  useEffect(() => {
    if (
      selectedInquiry &&
      !detailLoading &&
      detailData &&
      scrollableContentRef.current
    ) {
      setTimeout(() => {
        if (scrollableContentRef.current) {
          scrollableContentRef.current.scrollTop =
            scrollableContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedInquiry, detailLoading, detailData]);

  const fetchInquiries = async (preserveSelectedInquiry = false) => {
    try {
      const selectedInquiryId =
        preserveSelectedInquiry && selectedInquiry?.id
          ? selectedInquiry.id
          : null;

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
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMsg = data.message || 'Failed to fetch inquiries';
        const errorDetails = data.error || data.details || JSON.stringify(data);
        const fullError =
          errorDetails && errorDetails !== '{}'
            ? `${errorMsg}: ${errorDetails}`
            : errorMsg;
        throw new Error(fullError);
      }

      const updatedInquiries = data.inquiries || [];
      setInquiries(updatedInquiries);

      if (preserveSelectedInquiry && selectedInquiryId) {
        const updatedInquiry = updatedInquiries.find(
          (inq: InquiryWithRelations) => inq.id === selectedInquiryId
        );
        if (updatedInquiry) {
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

  const fetchInquiryDetails = async (showLoading = true) => {
    if (!selectedInquiry) return;

    try {
      if (showLoading) {
        setDetailLoading(true);
      }
      setDetailError(null);

      let userId = user?.id;
      if (!userId && typeof window !== 'undefined') {
        try {
          const storedUserData = localStorage.getItem('user_data');
          if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            userId = parsedUser.id;
          }
        } catch (err) {
          console.warn('Could not get user from localStorage:', err);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'GET',
        headers: headers as HeadersInit,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMessage = data.message || 'Failed to fetch inquiry details';
        const errorReason = data.reason ? ` (${data.reason})` : '';
        throw new Error(`${errorMessage}${errorReason}`);
      }

      setDetailData(data);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Failed to load details'
      );
    } finally {
      if (showLoading) {
        setDetailLoading(false);
      }
    }
  };

  // Filter and sort inquiries
  const filteredAndSortedInquiries = useMemo(() => {
    let filtered = [...inquiries];

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

    filtered.sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return filtered;
  }, [inquiries, searchQuery]);

  const handleViewDetails = (inquiry: InquiryWithRelations) => {
    setSelectedInquiry(inquiry);
  };

  const handleCloseDetails = () => {
    setSelectedInquiry(null);
    setDetailData(null);
    setDetailError(null);
    setNewResponse('');
    setResponseType('reply');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatResponseType = (responseType: string) => {
    return responseType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const isUserMessage = (message: MessageResponse) => {
    return user?.id && message.responder_id === user.id;
  };

  const handleEdit = (message: MessageResponse) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.message);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!selectedInquiry || !editMessageText.trim()) return;

    try {
      setIsSaving(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/inquiries/${selectedInquiry.id}/messages/${messageId}`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            message: editMessageText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update message');
      }

      await fetchInquiryDetails();
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Failed to update message'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!selectedInquiry || !detailData) return;

    if (
      !confirm(
        'Are you sure you want to delete this message? This action cannot be undone.'
      )
    ) {
      return;
    }

    const originalResponses = detailData.responses || [];
    setDetailData({
      ...detailData,
      responses: originalResponses.filter(
        (response: MessageResponse) => response.id !== messageId
      ),
    });

    try {
      setDeletingMessageId(messageId);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/inquiries/${selectedInquiry.id}/messages/${messageId}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setDetailData({
          ...detailData,
          responses: originalResponses,
        });
        throw new Error(data.message || 'Failed to delete message');
      }

      fetchInquiryDetails(false).catch(err => {
        console.error('Error refreshing after delete:', err);
      });
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Failed to delete message'
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !newResponse.trim()) {
      return;
    }

    if (!user?.id) {
      setDetailError('You must be logged in to submit a response');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      setDetailError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      };

      const requestBody = {
        message: newResponse.trim(),
        response_type: responseType,
        user_id: user.id,
      };

      const response = await fetch(
        `/api/inquiries/${selectedInquiry.id}/respond`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMessage =
          data.message || data.details || 'Failed to send response';
        throw new Error(errorMessage);
      }

      setNewResponse('');
      setResponseType('reply');

      if (data.response && detailData) {
        const newComment: MessageResponse = {
          id: data.response.id,
          inquiry_id: data.response.enquiry_id || selectedInquiry.id,
          responder_id:
            data.response.sender_id ||
            data.response.responder?.id ||
            user?.id ||
            '',
          response_type: data.response.response_type || responseType,
          message: data.response.message,
          is_template: false,
          created_at: data.response.created_at || new Date().toISOString(),
          responder:
            data.response.responder ||
            ({
              id: user?.id || '',
              email: user?.email || '',
              profiles: user?.profile
                ? {
                    first_name: user.profile.first_name || '',
                    last_name: user.profile.last_name || '',
                    avatar_url: user.profile.avatar_url || null,
                  }
                : null,
            } as any),
        };

        setDetailData({
          ...detailData,
          responses: [...(detailData.responses || []), newComment],
        });
      } else {
        fetchInquiryDetails(false).catch(err => {
          console.error('Error refreshing after comment submission:', err);
        });
      }

      setTimeout(() => {
        fetchInquiries(true);
      }, 100);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Failed to send response'
      );
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Get sender info helper
  const getSenderInfo = (inquiry: InquiryWithRelations) => {
    const eventManager = inquiry.event_manager as any;
    const profile = eventManager?.profiles;

    let name = 'Unknown';
    if (profile && (profile.first_name || profile.last_name)) {
      name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }

    return {
      name: name || eventManager?.email || 'Unknown',
      email: eventManager?.email || 'Not provided',
      phone: profile?.phone || 'Not provided',
      company: profile?.company_name || 'Not provided',
      avatarUrl: profile?.avatar_url || null,
    };
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
    <div className={`${className}`}>
      {/* Main Content - Split View with Sliding Animation */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Inquiries List - Slides out when inquiry selected */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            selectedInquiry ? 'w-0 opacity-0' : 'w-full opacity-100'
          }`}
        >
          <div className="w-full space-y-6">
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
                  const senderInfo = getSenderInfo(inquiry);

                  return (
                    <Card
                      key={inquiry.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 p-4"
                      onClick={() => handleViewDetails(inquiry)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage
                            src={senderInfo.avatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {senderInfo.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {inquiry.subject}
                            </h3>
                            <Badge
                              className={`ml-2 flex-shrink-0 ${getStatusColor(inquiry.status)}`}
                            >
                              {inquiry.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mb-1">
                            <span className="font-medium text-gray-700">
                              {senderInfo.name}
                            </span>
                            <span>•</span>
                            <span>{formatDate(inquiry.created_at)}</span>
                            {inquiry.event && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {inquiry.event.title}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {inquiry.message}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel - Slides in when inquiry selected */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            selectedInquiry ? 'w-full opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {selectedInquiry && (
            <div
              className="w-full h-full flex flex-col"
              style={{ height: 'calc(100vh - 180px)' }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDetails}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {selectedInquiry.subject}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(selectedInquiry.created_at)}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedInquiry.status)}>
                  {selectedInquiry.status}
                </Badge>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Column - Sender Info */}
                <div className="lg:col-span-1 self-start">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Contact Information
                    </h3>

                    {detailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Avatar and Name */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-16 w-16">
                            {getSenderInfo(selectedInquiry).avatarUrl && (
                              <AvatarImage
                                src={getSenderInfo(selectedInquiry).avatarUrl!}
                                alt={getSenderInfo(selectedInquiry).name}
                              />
                            )}
                            <AvatarFallback className="text-lg">
                              {getSenderInfo(selectedInquiry)
                                .name.charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">
                              {getSenderInfo(selectedInquiry).name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Event Manager
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          {/* Email */}
                          <div className="flex items-start space-x-3">
                            <Mail className="h-4 w-4 mt-1 text-gray-400" />
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Email
                              </p>
                              <p className="text-sm">
                                {getSenderInfo(selectedInquiry).email}
                              </p>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex items-start space-x-3">
                            <Phone className="h-4 w-4 mt-1 text-gray-400" />
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Phone
                              </p>
                              <p className="text-sm">
                                {getSenderInfo(selectedInquiry).phone}
                              </p>
                            </div>
                          </div>

                          {/* Company */}
                          <div className="flex items-start space-x-3">
                            <Building2 className="h-4 w-4 mt-1 text-gray-400" />
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Company
                              </p>
                              <p className="text-sm">
                                {getSenderInfo(selectedInquiry).company}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Event Info */}
                        {selectedInquiry.event && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">
                              Related Event
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-start space-x-3">
                                <Calendar className="h-4 w-4 mt-1 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {selectedInquiry.event.title}
                                  </p>
                                  {selectedInquiry.event.event_date && (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(
                                        selectedInquiry.event.event_date
                                      ).toLocaleDateString('en-NZ', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {selectedInquiry.event.location && (
                                <div className="flex items-start space-x-3">
                                  <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                                  <p className="text-sm">
                                    {selectedInquiry.event.location}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Profile Button - only show if sender has a published profile */}
                        {selectedInquiry.event_manager
                          ?.published_profile_id && (
                          <div className="border-t pt-4">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                window.open(
                                  `/contractors/${selectedInquiry.event_manager?.id}`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Column - Message Thread */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                  <Card className="p-6 flex flex-col flex-1 min-h-0">
                    <h3 className="text-lg font-semibold mb-4 flex-shrink-0">
                      Message Thread
                    </h3>

                    {detailLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    )}

                    {detailError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-sm text-red-600">{detailError}</p>
                      </div>
                    )}

                    {!detailLoading && !detailError && detailData && (
                      <>
                        {/* Scrollable Messages */}
                        <div
                          ref={scrollableContentRef}
                          className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0"
                        >
                          {detailData.responses &&
                          detailData.responses.length > 0 ? (
                            detailData.responses.map(
                              (response: MessageResponse, index: number) => {
                                const isOriginalMessage = index === 0;
                                const isEditing =
                                  editingMessageId === response.id;
                                const isDeleting =
                                  deletingMessageId === response.id;
                                const canEdit =
                                  isUserMessage(response) && !isOriginalMessage;
                                const isCurrentUser = isUserMessage(response);

                                return (
                                  <div
                                    key={response.id}
                                    className={`p-4 rounded-lg border ${
                                      isOriginalMessage
                                        ? 'bg-gray-50 border-gray-200'
                                        : 'bg-blue-50 border-blue-200'
                                    } ${
                                      !isOriginalMessage
                                        ? isCurrentUser
                                          ? 'mr-auto max-w-[90%]'
                                          : 'ml-auto max-w-[90%]'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        {response.responder?.profiles ? (
                                          <Avatar className="h-6 w-6">
                                            {response.responder.profiles
                                              .avatar_url &&
                                            response.responder.profiles.avatar_url.trim() ? (
                                              <AvatarImage
                                                src={
                                                  response.responder.profiles
                                                    .avatar_url
                                                }
                                                alt={`${response.responder.profiles.first_name} ${response.responder.profiles.last_name}`.trim()}
                                              />
                                            ) : null}
                                            <AvatarFallback>
                                              {response.responder.profiles
                                                .first_name?.[0] ||
                                                response.responder.profiles
                                                  .last_name?.[0] ||
                                                'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <Avatar className="h-6 w-6">
                                            <AvatarFallback>
                                              {response.responder?.email?.[0]?.toUpperCase() ||
                                                'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                          {response.responder?.profiles
                                            ? `${response.responder.profiles.first_name} ${response.responder.profiles.last_name}`.trim()
                                            : response.responder?.email ||
                                              'Unknown User'}
                                        </span>
                                        {!isOriginalMessage && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs capitalize"
                                          >
                                            {formatResponseType(
                                              response.response_type || 'reply'
                                            )}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">
                                          {formatDate(response.created_at)}
                                        </span>
                                        {canEdit && !isEditing && (
                                          <div className="flex items-center space-x-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={() =>
                                                handleEdit(response)
                                              }
                                              disabled={isDeleting}
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                              onClick={() =>
                                                handleDelete(response.id)
                                              }
                                              disabled={isDeleting}
                                            >
                                              {isDeleting ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <Trash2 className="h-3 w-3" />
                                              )}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editMessageText}
                                          onChange={e =>
                                            setEditMessageText(e.target.value)
                                          }
                                          rows={4}
                                          className="w-full"
                                        />
                                        <div className="flex items-center justify-end space-x-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            disabled={isSaving}
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleSaveEdit(response.id)
                                            }
                                            disabled={
                                              isSaving ||
                                              !editMessageText.trim()
                                            }
                                          >
                                            {isSaving ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                Saving...
                                              </>
                                            ) : (
                                              <>
                                                <Check className="h-4 w-4 mr-1" />
                                                Save
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {response.message}
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {getSenderInfo(selectedInquiry)
                                        .name.charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-gray-900">
                                    {getSenderInfo(selectedInquiry).name}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(selectedInquiry.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {selectedInquiry.message}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Response Form */}
                        {user && (
                          <div className="pt-4 border-t space-y-3 flex-shrink-0">
                            <Label htmlFor="response-type">Response Type</Label>
                            <Select
                              value={responseType}
                              onValueChange={setResponseType}
                            >
                              <SelectTrigger id="response-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(RESPONSE_TYPES).map(type => (
                                  <SelectItem key={type} value={type}>
                                    {formatResponseType(type)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Type your response..."
                              value={newResponse}
                              onChange={e => setNewResponse(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex items-center justify-end">
                              <Button
                                onClick={handleSubmitResponse}
                                disabled={
                                  !newResponse.trim() || isSubmittingResponse
                                }
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {isSubmittingResponse ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Response
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
