'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Edit2, Trash2, X, Check, Send } from 'lucide-react';
import { RESPONSE_TYPES } from '@/types/inquiries';
import { Inquiry, InquiryDetailResponse } from '@/types/inquiries';

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

interface InquiryDetailDialogProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond?: (inquiryId: string) => void; // Deprecated - no longer used
  onResponseSent?: number; // Trigger to refresh when response is sent
  onResponseSubmitted?: () => void; // Callback to refresh parent list
}

interface InquiryDetailData {
  inquiry: Inquiry;
  responses: MessageResponse[];
  success: boolean;
}

export function InquiryDetailDialog({
  inquiry,
  isOpen,
  onClose,
  onRespond,
  onResponseSent,
  onResponseSubmitted,
}: InquiryDetailDialogProps) {
  const { user } = useAuth();
  const [detailData, setDetailData] = useState<InquiryDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch inquiry details when dialog opens
  useEffect(() => {
    if (isOpen && inquiry) {
      // Fetch immediately - user check happens in fetchInquiryDetails
      fetchInquiryDetails();
    } else {
      setDetailData(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inquiry?.id]);

  // Refresh when response is sent
  useEffect(() => {
    if (
      isOpen &&
      inquiry &&
      onResponseSent !== undefined &&
      onResponseSent > 0
    ) {
      fetchInquiryDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResponseSent, isOpen, inquiry?.id]);

  // Scroll to bottom when modal opens and data is loaded
  useEffect(() => {
    if (isOpen && !loading && detailData && scrollableContentRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (scrollableContentRef.current) {
          scrollableContentRef.current.scrollTop =
            scrollableContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [isOpen, loading, detailData]);

  const fetchInquiryDetails = async (showLoading = true) => {
    if (!inquiry) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Get user ID from user object or localStorage fallback
      let userId = user?.id;
      if (!userId && typeof window !== 'undefined') {
        // Try to get from localStorage as fallback (useAuth stores as 'user_data')
        try {
          const storedUserData = localStorage.getItem('user_data');
          if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            userId = parsedUser.id;
            console.log('Got user ID from localStorage:', userId);
          }
        } catch (err) {
          console.warn('Could not get user from localStorage:', err);
        }
      }

      // Create headers object - only set one header (HTTP headers are case-insensitive)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add user-id header if we have a user ID
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: 'GET',
        headers: headers as HeadersInit,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMessage = data.message || 'Failed to fetch inquiry details';
        const errorReason = data.reason ? ` (${data.reason})` : '';
        console.error('Inquiry detail fetch error:', {
          status: response.status,
          message: errorMessage,
          reason: data.reason,
          fullData: data,
        });
        throw new Error(`${errorMessage}${errorReason}`);
      }

      setDetailData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Format response type label: convert underscores to spaces and capitalize
  const formatResponseType = (responseType: string) => {
    return responseType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
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
    if (!inquiry || !editMessageText.trim()) return;

    try {
      setIsSaving(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/inquiries/${inquiry.id}/messages/${messageId}`,
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

      // Refresh the details
      await fetchInquiryDetails();
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!inquiry || !detailData) return;

    if (
      !confirm(
        'Are you sure you want to delete this message? This action cannot be undone.'
      )
    ) {
      return;
    }

    // Optimistically remove the comment from the UI immediately
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
        `/api/inquiries/${inquiry.id}/messages/${messageId}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        // If deletion failed, restore the original responses
        setDetailData({
          ...detailData,
          responses: originalResponses,
        });
        throw new Error(data.message || 'Failed to delete message');
      }

      // Success - comment is already removed from UI
      // Optionally do a background refresh to ensure data is in sync
      // Don't show loading to avoid closing the modal
      fetchInquiryDetails(false).catch(err => {
        console.error('Error refreshing after delete:', err);
        // Don't show error to user since deletion was successful
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const isUserMessage = (message: MessageResponse) => {
    return user?.id && message.responder_id === user.id;
  };

  const handleSubmitResponse = async () => {
    if (!inquiry || !newResponse.trim()) {
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to submit a response');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      setError(null);

      console.log('Submitting response:', {
        inquiryId: inquiry.id,
        userId: user.id,
        responseType,
        messageLength: newResponse.trim().length,
      });

      // Create headers object - only set one header (HTTP headers are case-insensitive)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      };

      const requestBody = {
        message: newResponse.trim(),
        response_type: responseType,
        user_id: user.id,
      };

      console.log('Request body:', requestBody);
      console.log('Request headers:', headers);

      const response = await fetch(`/api/inquiries/${inquiry.id}/respond`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok || data.success === false) {
        const errorMessage =
          data.message || data.details || 'Failed to send response';
        console.error('Response error:', errorMessage, data);
        throw new Error(errorMessage);
      }

      // Clear the input
      setNewResponse('');
      setResponseType('reply');

      // Optimistically add the new comment to the thread without full refresh
      // The API returns { success: true, response: messageData with responder }
      if (data.response && detailData) {
        // Create the new comment object in the expected format
        // The API now returns the responder data, so we can use it directly
        const newComment: MessageResponse = {
          id: data.response.id,
          inquiry_id: data.response.enquiry_id || inquiry.id,
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

        // Add the new comment to the existing responses
        setDetailData({
          ...detailData,
          responses: [...(detailData.responses || []), newComment],
        });
      } else {
        // Fallback: if we don't have the comment data, do a lightweight refresh in background
        // Don't show loading to avoid closing the modal
        fetchInquiryDetails(false).catch(err => {
          console.error('Error refreshing after comment submission:', err);
          // Don't show error to user since comment was successfully submitted
        });
      }

      // Trigger refresh in parent if callback exists (for list updates)
      // Do this in the background without affecting the modal
      if (onResponseSubmitted) {
        // Use setTimeout to defer the parent refresh, allowing the UI to update first
        setTimeout(() => {
          onResponseSubmitted();
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (!inquiry) return null;

  const eventManager = detailData?.inquiry.event_manager as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 space-y-3">
          <DialogHeader className="pb-0">
            <DialogTitle>{inquiry.subject}</DialogTitle>
            <DialogDescription>
              Inquiry from{' '}
              {eventManager?.profiles
                ? `${eventManager.profiles.first_name} ${eventManager.profiles.last_name}`.trim()
                : eventManager?.email || 'Unknown User'}{' '}
              • {formatDate(inquiry.created_at)}
            </DialogDescription>
          </DialogHeader>

          {/* Status */}
          {!loading && !error && detailData && (
            <div className="flex items-center justify-between pt-2">
              <Badge
                className={getStatusColor(detailData.inquiry.status || 'sent')}
              >
                {detailData.inquiry.status || 'sent'}
              </Badge>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollableContentRef}
          className="overflow-y-auto flex-1 px-6 py-4"
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && detailData && (
            <div className="space-y-6">
              {/* Message Thread */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Message Thread</h3>
                <div className="space-y-3">
                  {/* Show all messages from enquiry_messages table in chronological order */}
                  {detailData?.responses && detailData.responses.length > 0 ? (
                    detailData.responses.map(
                      (response: MessageResponse, index: number) => {
                        // First message is the original enquiry message
                        const isOriginalMessage = index === 0;
                        const isEditing = editingMessageId === response.id;
                        const isDeleting = deletingMessageId === response.id;
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
                                  ? 'ml-auto max-w-[90%]'
                                  : 'mr-auto max-w-[90%]'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {response.responder?.profiles ? (
                                  <Avatar className="h-6 w-6">
                                    {response.responder.profiles.avatar_url &&
                                    response.responder.profiles.avatar_url.trim() ? (
                                      <AvatarImage
                                        src={
                                          response.responder.profiles.avatar_url
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
                                      onClick={() => handleEdit(response)}
                                      disabled={isDeleting}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      onClick={() => handleDelete(response.id)}
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
                                    onClick={() => handleSaveEdit(response.id)}
                                    disabled={
                                      isSaving || !editMessageText.trim()
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
                    // Fallback: Show original message from enquiries.message if no messages in enquiry_messages
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {eventManager?.profiles ? (
                            <Avatar className="h-6 w-6">
                              {eventManager.profiles.avatar_url &&
                              eventManager.profiles.avatar_url.trim() ? (
                                <AvatarImage
                                  src={eventManager.profiles.avatar_url}
                                  alt={`${eventManager.profiles.first_name} ${eventManager.profiles.last_name}`.trim()}
                                />
                              ) : null}
                              <AvatarFallback>
                                {eventManager.profiles.first_name?.[0] ||
                                  eventManager.profiles.last_name?.[0] ||
                                  'U'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {eventManager?.email?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {eventManager?.profiles
                              ? `${eventManager.profiles.first_name} ${eventManager.profiles.last_name}`.trim()
                              : eventManager?.email || 'Unknown Sender'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(inquiry.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {inquiry.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Response Section */}
              {user && (
                <div className="pt-4 border-t space-y-3">
                  <Label htmlFor="response-type">Response Type</Label>
                  <Select value={responseType} onValueChange={setResponseType}>
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
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!newResponse.trim() || isSubmittingResponse}
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

              {/* Actions (when user is not logged in) */}
              {!user && (
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
