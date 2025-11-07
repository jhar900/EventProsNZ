'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Edit2, Trash2, X, Check } from 'lucide-react';
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
  onRespond?: (inquiryId: string) => void;
  onResponseSent?: number; // Trigger to refresh when response is sent
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

  // Fetch inquiry details when dialog opens
  useEffect(() => {
    if (isOpen && inquiry) {
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

  const fetchInquiryDetails = async () => {
    if (!inquiry) return;

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: 'GET',
        headers,
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
      setLoading(false);
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

  const handleEdit = (message: InquiryResponse) => {
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
    if (!inquiry) return;

    if (
      !confirm(
        'Are you sure you want to delete this message? This action cannot be undone.'
      )
    ) {
      return;
    }

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
        throw new Error(data.message || 'Failed to delete message');
      }

      // Refresh the details
      await fetchInquiryDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const isUserMessage = (message: MessageResponse) => {
    return user?.id && message.responder_id === user.id;
  };

  if (!inquiry) return null;

  const eventManager = detailData?.inquiry.event_manager as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inquiry.subject}</DialogTitle>
          <DialogDescription>
            Inquiry from{' '}
            {eventManager?.profiles
              ? `${eventManager.profiles.first_name} ${eventManager.profiles.last_name}`.trim()
              : eventManager?.email || 'Unknown User'}{' '}
            • {formatDate(inquiry.created_at)}
          </DialogDescription>
        </DialogHeader>

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
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge
                className={getStatusColor(detailData.inquiry.status || 'sent')}
              >
                {detailData.inquiry.status || 'sent'}
              </Badge>
            </div>

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

                      return (
                        <div
                          key={response.id}
                          className={`p-4 rounded-lg border ${
                            isOriginalMessage
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {response.responder?.profiles ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={
                                      response.responder.profiles.avatar_url ||
                                      undefined
                                    }
                                  />
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
                                  : response.responder?.email || 'Unknown User'}
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
                                  disabled={isSaving || !editMessageText.trim()}
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
                            <AvatarImage
                              src={
                                eventManager.profiles.avatar_url || undefined
                              }
                            />
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

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onRespond && (
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => onRespond(inquiry.id)}
                >
                  Respond
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
