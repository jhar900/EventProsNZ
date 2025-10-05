'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
  Quote,
  MoreHorizontal,
  Calendar,
  MapPin,
  DollarSign,
} from 'lucide-react';
import {
  Inquiry,
  InquiryStatus as InquiryStatusType,
  INQUIRY_STATUS,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

interface InquiryStatusProps {
  inquiries: Inquiry[];
  onStatusUpdate: (
    inquiryId: string,
    status: InquiryStatusType
  ) => Promise<void>;
  isLoading?: boolean;
}

export function InquiryStatus({
  inquiries = [],
  onStatusUpdate,
  isLoading = false,
}: InquiryStatusProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingInquiry, setUpdatingInquiry] = useState<string | null>(null);

  // Filter inquiries by status
  const filteredInquiries =
    selectedStatus === 'all'
      ? inquiries || []
      : (inquiries || []).filter(inquiry => inquiry.status === selectedStatus);

  // Get status icon
  const getStatusIcon = (status: InquiryStatusType) => {
    switch (status) {
      case INQUIRY_STATUS.SENT:
        return <Send className="h-4 w-4" />;
      case INQUIRY_STATUS.VIEWED:
        return <Eye className="h-4 w-4" />;
      case INQUIRY_STATUS.RESPONDED:
        return <Reply className="h-4 w-4" />;
      case INQUIRY_STATUS.QUOTED:
        return <Quote className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: InquiryStatusType) => {
    switch (status) {
      case INQUIRY_STATUS.SENT:
        return 'bg-blue-100 text-blue-800';
      case INQUIRY_STATUS.VIEWED:
        return 'bg-yellow-100 text-yellow-800';
      case INQUIRY_STATUS.RESPONDED:
        return 'bg-green-100 text-green-800';
      case INQUIRY_STATUS.QUOTED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case INQUIRY_PRIORITY.LOW:
        return 'bg-gray-100 text-gray-800';
      case INQUIRY_PRIORITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case INQUIRY_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800';
      case INQUIRY_PRIORITY.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle status update
  const handleStatusUpdate = async (
    inquiryId: string,
    newStatus: InquiryStatusType
  ) => {
    try {
      setUpdatingInquiry(inquiryId);
      await onStatusUpdate(inquiryId, newStatus);
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
    } finally {
      setUpdatingInquiry(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status counts
  const statusCounts = {
    all: (inquiries || []).length,
    sent: (inquiries || []).filter(i => i.status === INQUIRY_STATUS.SENT)
      .length,
    viewed: (inquiries || []).filter(i => i.status === INQUIRY_STATUS.VIEWED)
      .length,
    responded: (inquiries || []).filter(
      i => i.status === INQUIRY_STATUS.RESPONDED
    ).length,
    quoted: (inquiries || []).filter(i => i.status === INQUIRY_STATUS.QUOTED)
      .length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading inquiry status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Status Overview</CardTitle>
          <CardDescription>
            Track the status of your inquiries and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {status === 'all' ? 'Total' : status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Inquiries ({statusCounts.all})
              </SelectItem>
              <SelectItem value={INQUIRY_STATUS.SENT}>
                Sent ({statusCounts.sent})
              </SelectItem>
              <SelectItem value={INQUIRY_STATUS.VIEWED}>
                Viewed ({statusCounts.viewed})
              </SelectItem>
              <SelectItem value={INQUIRY_STATUS.RESPONDED}>
                Responded ({statusCounts.responded})
              </SelectItem>
              <SelectItem value={INQUIRY_STATUS.QUOTED}>
                Quoted ({statusCounts.quoted})
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Inquiry List */}
      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              No inquiries found with the selected status.
            </AlertDescription>
          </Alert>
        ) : (
          filteredInquiries.map(inquiry => (
            <Card
              key={inquiry.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={inquiry.contractor?.profiles?.avatar_url}
                        />
                        <AvatarFallback>
                          {inquiry.contractor?.profiles?.first_name?.[0]}
                          {inquiry.contractor?.profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">
                          {inquiry.contractor?.profiles?.first_name}{' '}
                          {inquiry.contractor?.profiles?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {inquiry.contractor?.business_profiles?.company_name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{inquiry.subject}</h3>
                      <p className="text-gray-600 line-clamp-2">
                        {inquiry.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(inquiry.created_at)}
                      </div>
                      {inquiry.event && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {inquiry.event.title}
                        </div>
                      )}
                      {inquiry.event_details?.budget_total && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />$
                          {inquiry.event_details.budget_total.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {getStatusIcon(inquiry.status)}
                        <span className="ml-1 capitalize">
                          {inquiry.status}
                        </span>
                      </Badge>
                      {inquiry.priority && (
                        <Badge className={getPriorityColor(inquiry.priority)}>
                          {inquiry.priority}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {inquiry.status === INQUIRY_STATUS.SENT && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(
                              inquiry.id,
                              INQUIRY_STATUS.VIEWED
                            )
                          }
                          disabled={updatingInquiry === inquiry.id}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Mark as Viewed
                        </Button>
                      )}

                      {inquiry.status === INQUIRY_STATUS.VIEWED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(
                              inquiry.id,
                              INQUIRY_STATUS.RESPONDED
                            )
                          }
                          disabled={updatingInquiry === inquiry.id}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Mark as Responded
                        </Button>
                      )}

                      {inquiry.status === INQUIRY_STATUS.RESPONDED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(
                              inquiry.id,
                              INQUIRY_STATUS.QUOTED
                            )
                          }
                          disabled={updatingInquiry === inquiry.id}
                        >
                          <Quote className="h-4 w-4 mr-1" />
                          Mark as Quoted
                        </Button>
                      )}

                      {updatingInquiry === inquiry.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
