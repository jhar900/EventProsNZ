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
  AlertCircle,
  Search,
} from 'lucide-react';
import { Inquiry } from '@/types/inquiries';
import { InquiryDetailDialog } from '../inquiries/InquiryDetailDialog';
import { QuickResponseDialog } from '../inquiries/QuickResponseDialog';

interface EventManagerConnectionsListProps {
  className?: string;
  compact?: boolean;
}

export interface ConnectionWithRelations extends Inquiry {
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

export default function EventManagerConnectionsList({
  className = '',
  compact = false,
}: EventManagerConnectionsListProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionWithRelations | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseInquiryId, setResponseInquiryId] = useState<string>('');
  const [responseInquirySubject, setResponseInquirySubject] =
    useState<string>('');

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchConnections = async (preserveSelected = false) => {
    try {
      const selectedId =
        preserveSelected && selectedConnection?.id
          ? selectedConnection.id
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
        const errorMsg = data.message || 'Failed to fetch connections';
        const errorDetails = data.error || data.details || JSON.stringify(data);
        const fullError =
          errorDetails && errorDetails !== '{}'
            ? `${errorMsg}: ${errorDetails}`
            : errorMsg;
        console.error('Connections fetch error:', {
          status: response.status,
          message: errorMsg,
          error: data.error,
        });
        throw new Error(fullError);
      }

      const updatedConnections = data.inquiries || [];
      setConnections(updatedConnections);

      if (preserveSelected && selectedId) {
        const updated = updatedConnections.find(
          (conn: ConnectionWithRelations) => conn.id === selectedId
        );
        if (updated) {
          setSelectedConnection(updated);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load connections'
      );
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedConnections = useMemo(() => {
    let filtered = [...connections];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        comm =>
          comm.subject.toLowerCase().includes(query) ||
          comm.message.toLowerCase().includes(query) ||
          (comm.contractor as any)?.email?.toLowerCase().includes(query) ||
          (comm.contractor as any)?.profiles?.first_name
            ?.toLowerCase()
            .includes(query) ||
          (comm.contractor as any)?.profiles?.last_name
            ?.toLowerCase()
            .includes(query) ||
          (comm.contractor as any)?.business_profiles?.company_name
            ?.toLowerCase()
            .includes(query) ||
          comm.event?.title?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return filtered;
  }, [connections, searchQuery]);

  const handleViewDetails = (conn: ConnectionWithRelations) => {
    setSelectedConnection(conn);
    setIsDetailDialogOpen(true);
  };

  const handleRespond = (conn: ConnectionWithRelations) => {
    setResponseInquiryId(conn.id);
    setResponseInquirySubject(conn.subject);
    setIsResponseDialogOpen(true);
  };

  const [responseSentTrigger, setResponseSentTrigger] = useState(0);

  const handleResponseSuccess = () => {
    fetchConnections();
    setResponseSentTrigger(prev => prev + 1);
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
            <p className="font-semibold">Failed to fetch connections</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
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

      {/* Connections List */}
      {filteredAndSortedConnections.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {connections.length === 0
              ? 'No Connections Yet'
              : 'No Connections Match Your Filters'}
          </h3>
          <p className="text-gray-600">
            {connections.length === 0
              ? "You haven't made any connections yet. When you contact contractors, they'll appear here."
              : 'Try adjusting your search criteria.'}
          </p>
        </Card>
      ) : (
        <div className={compact ? 'space-y-2' : 'space-y-4'}>
          {filteredAndSortedConnections.map(conn => {
            const contractor = conn.contractor as any;
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

            return (
              <Card
                key={conn.id}
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
                          {contractorName.charAt(0).toUpperCase()}
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
                            {conn.subject}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(conn.status)}>
                              {conn.status}
                            </Badge>
                          </div>
                        </div>
                        <div
                          className={`flex items-center space-x-4 text-xs text-gray-600 ${compact ? 'mb-1' : 'mb-3'}`}
                        >
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{contractorName}</span>
                            {businessProfile?.company_name && (
                              <span className="ml-1 text-gray-500">
                                ({businessProfile.company_name})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(conn.created_at)}</span>
                          </div>
                          {conn.event && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{conn.event.title}</span>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-gray-700 ${compact ? 'mb-2 line-clamp-2 text-sm' : 'mb-4 line-clamp-3'}`}
                        >
                          {conn.message}
                        </p>
                        {conn.event && conn.event.event_date && (
                          <div
                            className={`flex items-center text-xs text-gray-600 ${compact ? 'mb-1' : 'mb-2'}`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              Event Date:{' '}
                              {new Date(
                                conn.event.event_date
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
                    onClick={() => handleViewDetails(conn)}
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
        inquiry={selectedConnection as any}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedConnection(null);
        }}
        onResponseSent={responseSentTrigger}
        onResponseSubmitted={() => {
          fetchConnections(true);
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
