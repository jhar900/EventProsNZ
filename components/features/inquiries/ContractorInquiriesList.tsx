'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { Inquiry } from '@/types/inquiries';

interface ContractorInquiriesListProps {
  className?: string;
}

interface InquiryWithRelations extends Inquiry {
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
}: ContractorInquiriesListProps) {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

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

      setInquiries(data.inquiries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
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
      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Inquiries
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('sent')}
          >
            Sent
          </Button>
          <Button
            variant={statusFilter === 'viewed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('viewed')}
          >
            Viewed
          </Button>
          <Button
            variant={statusFilter === 'responded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('responded')}
          >
            Responded
          </Button>
          <Button
            variant={statusFilter === 'quoted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('quoted')}
          >
            Quoted
          </Button>
        </div>
      </Card>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Inquiries Yet
          </h3>
          <p className="text-gray-600">
            You haven&apos;t received any inquiries yet. When event managers
            contact you, they&apos;ll appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiries.map(inquiry => {
            const eventManager = inquiry.event_manager as any;
            const profile = eventManager?.profiles;
            const managerName = profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                eventManager?.email ||
                'Unknown'
              : eventManager?.email || 'Unknown';

            return (
              <Card
                key={inquiry.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {managerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {inquiry.subject}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                            {inquiry.priority && (
                              <Badge
                                className={getPriorityColor(inquiry.priority)}
                              >
                                {inquiry.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{managerName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(inquiry.created_at)}</span>
                          </div>
                          {inquiry.event && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{inquiry.event.title}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {inquiry.message}
                        </p>
                        {inquiry.event && inquiry.event.event_date && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
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
                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Respond
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
