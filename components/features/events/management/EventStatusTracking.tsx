'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { EVENT_STATUS } from '@/types/events';

interface EventStatusTrackingProps {
  eventId: string;
}

interface StatusHistory {
  id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export function EventStatusTracking({ eventId }: EventStatusTrackingProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    loadStatusHistory();
  }, [eventId]);

  const loadStatusHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/status`);
      const data = await response.json();

      if (data.success) {
        setStatusHistory(data.event.event_status_history || []);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewStatus('');
        setReason('');
        setShowUpdateForm(false);
        await loadStatusHistory();
      } else {
        }
    } catch (error) {
      } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Update Event Status
          </CardTitle>
          <CardDescription>
            Change the status of this event and provide a reason for the change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showUpdateForm ? (
            <Button onClick={() => setShowUpdateForm(true)}>
              Update Status
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EVENT_STATUS).map(status => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for status change..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setNewStatus('');
                    setReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Status History
          </CardTitle>
          <CardDescription>
            Track all status changes for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No status changes recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((history, index) => (
                <div
                  key={history.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(history.new_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(history.new_status)}>
                          {getStatusLabel(history.new_status)}
                        </Badge>
                        {history.previous_status && (
                          <>
                            <span className="text-muted-foreground">from</span>
                            <Badge variant="outline">
                              {getStatusLabel(history.previous_status)}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(history.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      {history.profiles
                        ? `${history.profiles.first_name} ${history.profiles.last_name}`
                        : 'Unknown User'}
                    </div>
                    {history.reason && (
                      <div className="mt-2 flex items-start text-sm">
                        <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {history.reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
