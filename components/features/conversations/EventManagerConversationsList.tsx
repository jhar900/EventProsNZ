'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Clock,
  AlertCircle,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { Inquiry } from '@/types/inquiries';
import { ContactDetailsPanel } from './ContactDetailsPanel';
import { ConversationDetailPanel } from './ConversationDetailPanel';

interface EventManagerConversationsListProps {
  className?: string;
}

export interface ConversationWithRelations extends Inquiry {
  contractor?: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
    business_profiles?: {
      company_name: string;
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

export default function EventManagerConversationsList({
  className = '',
}: EventManagerConversationsListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<
    ConversationWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithRelations | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchConversations = async (preserveSelected = false) => {
    try {
      const selectedId =
        preserveSelected && selectedConversation?.id
          ? selectedConversation.id
          : null;

      if (!preserveSelected) {
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
        const errorMsg = data.message || 'Failed to fetch conversations';
        const errorDetails = data.error || data.details || JSON.stringify(data);
        const fullError =
          errorDetails && errorDetails !== '{}'
            ? `${errorMsg}: ${errorDetails}`
            : errorMsg;
        console.error('Conversations fetch error:', {
          status: response.status,
          message: errorMsg,
          error: data.error,
        });
        throw new Error(fullError);
      }

      const updatedConversations = data.inquiries || [];
      setConversations(updatedConversations);

      if (preserveSelected && selectedId) {
        const updated = updatedConversations.find(
          (conv: ConversationWithRelations) => conv.id === selectedId
        );
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load conversations'
      );
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = [...conversations];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        conv =>
          conv.subject.toLowerCase().includes(query) ||
          conv.message.toLowerCase().includes(query) ||
          (conv.contractor as any)?.email?.toLowerCase().includes(query) ||
          (conv.contractor as any)?.profiles?.first_name
            ?.toLowerCase()
            .includes(query) ||
          (conv.contractor as any)?.profiles?.last_name
            ?.toLowerCase()
            .includes(query) ||
          (conv.contractor as any)?.business_profiles?.company_name
            ?.toLowerCase()
            .includes(query) ||
          conv.event?.title?.toLowerCase().includes(query)
      );
    }

    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Newest first
    });

    return filtered;
  }, [conversations, searchQuery]);

  const handleSelectConversation = (conv: ConversationWithRelations) => {
    setSelectedConversation(conv);
  };

  const handleCloseDetail = () => {
    setSelectedConversation(null);
  };

  const handleResponseSubmitted = () => {
    fetchConversations(true);
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
            <p className="font-semibold">Failed to fetch conversations</p>
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
    <div className={`h-full ${className}`}>
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Search by subject, message, or contractor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 border-0 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none focus:bg-gray-100"
          />
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Conversations List - Slides out when conversation selected */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            selectedConversation ? 'w-0 opacity-0' : 'w-full opacity-100'
          }`}
        >
          <div className="w-full overflow-y-auto h-full pr-6">
            {filteredAndSortedConversations.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {conversations.length === 0
                    ? 'No Conversations Yet'
                    : 'No Conversations Match Your Filters'}
                </h3>
                <p className="text-gray-600">
                  {conversations.length === 0
                    ? "You haven't started any conversations yet. When you contact contractors, they'll appear here."
                    : 'Try adjusting your search criteria.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedConversations.map(conv => {
                  const contractor = conv.contractor as any;
                  const profile = contractor?.profiles;
                  const businessProfile = contractor?.business_profiles;
                  let contractorName = 'Unknown';
                  if (profile && (profile.first_name || profile.last_name)) {
                    const fullName =
                      `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                    contractorName =
                      fullName ||
                      businessProfile?.company_name ||
                      contractor?.email ||
                      'Unknown';
                  } else if (businessProfile?.company_name) {
                    contractorName = businessProfile.company_name;
                  } else if (contractor?.email) {
                    contractorName = contractor.email;
                  }

                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <Card
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-orange-500 bg-orange-50'
                          : 'hover:shadow-md hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>
                            {contractorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {conv.subject}
                            </h3>
                            <Badge
                              className={`ml-2 flex-shrink-0 ${getStatusColor(conv.status)}`}
                            >
                              {conv.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                            <div className="flex items-center truncate">
                              <User className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{contractorName}</span>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>
                                {new Date(conv.created_at).toLocaleDateString(
                                  'en-NZ'
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {conv.message}
                          </p>
                          {conv.event && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">
                                {conv.event.title}
                              </span>
                              {conv.event.event_date && (
                                <span className="ml-1 flex-shrink-0">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(
                                    conv.event.event_date
                                  ).toLocaleDateString('en-NZ')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel - Slides in when conversation selected */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            selectedConversation ? 'w-full opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="w-full h-full flex gap-4 pl-6">
            {/* Contact Details - Left Column */}
            <Card className="w-1/3 h-full overflow-hidden flex flex-col">
              <div className="flex items-center p-3 border-b bg-gray-50">
                <button
                  onClick={handleCloseDetail}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-2"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </button>
                <h3 className="text-sm font-semibold text-gray-700">
                  Contact Details
                </h3>
              </div>
              {selectedConversation && (
                <ContactDetailsPanel
                  contractor={selectedConversation.contractor as any}
                  event={selectedConversation.event ?? null}
                  inquiryStatus={selectedConversation.status}
                  inquiryDate={selectedConversation.created_at}
                />
              )}
            </Card>

            {/* Conversation Log - Right Column */}
            <Card className="w-2/3 overflow-hidden">
              <ConversationDetailPanel
                inquiry={selectedConversation}
                onResponseSubmitted={handleResponseSubmitted}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
