'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  History,
  MessageSquare,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusHistoryItem {
  id: string;
  status: string;
  changed_by: string;
  comments: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface FeatureRequestStatusProps {
  featureRequestId: string;
  currentStatus:
    | 'submitted'
    | 'planned'
    | 'in_development'
    | 'completed'
    | 'rejected';
  isAdmin?: boolean;
  onStatusChange?: (newStatus: string, comments: string) => void;
  className?: string;
}

export default function FeatureRequestStatus({
  featureRequestId,
  currentStatus,
  isAdmin = false,
  onStatusChange,
  className = '',
}: FeatureRequestStatusProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComments, setStatusComments] = useState('');

  // Load status history on mount
  useEffect(() => {
    const loadStatusHistory = async () => {
      try {
        const response = await fetch(
          `/api/feature-requests/${featureRequestId}`
        );
        if (response.ok) {
          const data = await response.json();
          setStatusHistory(data.feature_request_status_history || []);
        }
      } catch (error) {
        console.error('Error loading status history:', error);
      }
    };

    loadStatusHistory();
  }, [featureRequestId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'planned':
        return <Clock className="w-4 h-4" />;
      case 'in_development':
        return <PlayCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_development':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Your feature request has been submitted and is awaiting review.';
      case 'planned':
        return 'Your feature request has been approved and is planned for development.';
      case 'in_development':
        return 'Your feature request is currently being developed.';
      case 'completed':
        return 'Your feature request has been completed and is now available.';
      case 'rejected':
        return 'Your feature request has been reviewed but will not be implemented.';
      default:
        return 'Status unknown.';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === currentStatus) {
      toast.error('Please select a different status');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/feature-requests/${featureRequestId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            admin_notes: statusComments,
          }),
        }
      );

      if (response.ok) {
        toast.success('Status updated successfully');
        setShowStatusChange(false);
        setNewStatus('');
        setStatusComments('');

        if (onStatusChange) {
          onStatusChange(newStatus, statusComments);
        }

        // Reload status history
        const historyResponse = await fetch(
          `/api/feature-requests/${featureRequestId}`
        );
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setStatusHistory(data.feature_request_status_history || []);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_development', label: 'In Development' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge
              className={`text-sm px-3 py-1 ${getStatusColor(currentStatus)}`}
            >
              {currentStatus
                .replace('_', ' ')
                .replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>

            <p className="text-sm text-gray-600">
              {getStatusDescription(currentStatus)}
            </p>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusChange(!showStatusChange)}
                className="w-fit"
              >
                {showStatusChange ? 'Cancel' : 'Change Status'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Change Form */}
      {showStatusChange && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Change Status</CardTitle>
            <CardDescription>
              Update the status of this feature request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions
                    .filter(option => option.value !== currentStatus)
                    .map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(option.value)}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-comments">Comments (Optional)</Label>
              <Textarea
                id="status-comments"
                value={statusComments}
                onChange={e => setStatusComments(e.target.value)}
                placeholder="Add any comments about this status change..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStatusChange}
                disabled={isLoading || !newStatus}
                className="flex items-center gap-2"
              >
                {isLoading ? 'Updating...' : 'Update Status'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusChange(false);
                  setNewStatus('');
                  setStatusComments('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Status History
            </CardTitle>
            <CardDescription>
              Track the progression of this feature request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status
                            .replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.comments && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.comments}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {item.profiles
                          ? `${item.profiles.first_name} ${item.profiles.last_name}`
                          : 'System'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
