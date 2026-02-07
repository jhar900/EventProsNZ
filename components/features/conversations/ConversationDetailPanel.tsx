'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import {
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
  Send,
  MessageSquare,
} from 'lucide-react';
import { RESPONSE_TYPES } from '@/types/inquiries';
import { Inquiry } from '@/types/inquiries';

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

interface ConversationDetailPanelProps {
  inquiry: Inquiry | null;
  onResponseSubmitted?: () => void;
}

export function ConversationDetailPanel({
  inquiry,
  onResponseSubmitted,
}: ConversationDetailPanelProps) {
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

  useEffect(() => {
    if (inquiry) {
      fetchInquiryDetails();
    } else {
      setDetailData(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.id]);

  useEffect(() => {
    if (!loading && detailData && scrollableContentRef.current) {
      setTimeout(() => {
        if (scrollableContentRef.current) {
          scrollableContentRef.current.scrollTop =
            scrollableContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [loading, detailData]);

  const fetchInquiryDetails = async (showLoading = true) => {
    if (!inquiry) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

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

      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
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
      setError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const formatResponseType = (responseType: string) => {
    return responseType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'short',
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      };

      const requestBody = {
        message: newResponse.trim(),
        response_type: responseType,
        user_id: user.id,
      };

      const response = await fetch(`/api/inquiries/${inquiry.id}/respond`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

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

        setDetailData({
          ...detailData,
          responses: [...(detailData.responses || []), newComment],
        });
      } else {
        fetchInquiryDetails(false).catch(err => {
          console.error('Error refreshing after comment submission:', err);
        });
      }

      if (onResponseSubmitted) {
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

  if (!inquiry) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  const eventManager = detailData?.inquiry.event_manager as any;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {inquiry.subject}
        </h2>
        <p className="text-sm text-gray-600">
          From{' '}
          {eventManager?.profiles
            ? `${eventManager.profiles.first_name} ${eventManager.profiles.last_name}`.trim()
            : eventManager?.email || 'Unknown User'}{' '}
          • {formatDate(inquiry.created_at)}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
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
          <>
            {detailData?.responses && detailData.responses.length > 0 ? (
              detailData.responses.map(
                (response: MessageResponse, index: number) => {
                  const isOriginalMessage = index === 0;
                  const isEditing = editingMessageId === response.id;
                  const isDeleting = deletingMessageId === response.id;
                  const canEdit = isUserMessage(response) && !isOriginalMessage;
                  const isCurrentUser = isUserMessage(response);

                  return (
                    <div
                      key={response.id}
                      className={`p-3 rounded-lg border ${
                        isOriginalMessage
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200'
                      } ${
                        !isOriginalMessage
                          ? isCurrentUser
                            ? 'ml-auto max-w-[85%]'
                            : 'mr-auto max-w-[85%]'
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
                                  src={response.responder.profiles.avatar_url}
                                  alt={`${response.responder.profiles.first_name} ${response.responder.profiles.last_name}`.trim()}
                                />
                              ) : null}
                              <AvatarFallback>
                                {response.responder.profiles.first_name?.[0] ||
                                  response.responder.profiles.last_name?.[0] ||
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
                            onChange={e => setEditMessageText(e.target.value)}
                            rows={3}
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
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
          </>
        )}
      </div>

      {/* Reply Section */}
      {user && (
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="response-type"
              className="text-sm whitespace-nowrap"
            >
              Type:
            </Label>
            <Select value={responseType} onValueChange={setResponseType}>
              <SelectTrigger id="response-type" className="w-32 h-8">
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
          </div>
          <div className="flex items-end space-x-2">
            <Textarea
              placeholder="Type your response..."
              value={newResponse}
              onChange={e => setNewResponse(e.target.value)}
              className="min-h-[60px] flex-1"
            />
            <Button
              onClick={handleSubmitResponse}
              disabled={!newResponse.trim() || isSubmittingResponse}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingResponse ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
