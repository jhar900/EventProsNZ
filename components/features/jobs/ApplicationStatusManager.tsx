'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { JobApplicationWithDetails, ApplicationStatus } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationStatusManagerProps {
  application: JobApplicationWithDetails;
  onStatusUpdate?: (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => void;
  onStatusUpdateSuccess?: (application: JobApplicationWithDetails) => void;
  onStatusUpdateError?: (error: string) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  {
    value: 'reviewed',
    label: 'Reviewed',
    color: 'bg-blue-100 text-blue-800',
    icon: EyeIcon,
  },
  {
    value: 'accepted',
    label: 'Accepted',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  {
    value: 'rejected',
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
];

export function ApplicationStatusManager({
  application,
  onStatusUpdate,
  onStatusUpdateSuccess,
  onStatusUpdateError,
  className = '',
}: ApplicationStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    application.status
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatusOption = STATUS_OPTIONS.find(
    option => option.value === application.status
  );
  const selectedStatusOption = STATUS_OPTIONS.find(
    option => option.value === selectedStatus
  );

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === application.status) return;

    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update application status');
      }

      const data = await response.json();

      if (data.success) {
        onStatusUpdate?.(application.id, newStatus);
        onStatusUpdateSuccess?.(data.application);
        setSelectedStatus(newStatus);
      } else {
        throw new Error(data.error || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update application status';
      setError(errorMessage);
      onStatusUpdateError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.icon : ClockIcon;
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const canUpdateStatus = () => {
    // Only job posters can update application status
    // This would need to be determined by the parent component
    return true; // For now, assume user can update
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Application Status
            </h3>
            <p className="text-sm text-gray-600">
              Manage the status of this job application
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(application.status)}>
              <div className="flex items-center space-x-1">
                {React.createElement(getStatusIcon(application.status), {
                  className: 'h-3 w-3',
                })}
                <span>{getStatusLabel(application.status)}</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Update Form */}
        {canUpdateStatus() && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Update Status
              </label>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedStatus}
                  onValueChange={value =>
                    setSelectedStatus(value as ApplicationStatus)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => handleStatusChange(selectedStatus)}
                  disabled={isUpdating || selectedStatus === application.status}
                  size="sm"
                >
                  {isUpdating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>

            {/* Status Change Preview */}
            {selectedStatus !== application.status && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-800">
                    Status will change from:
                  </span>
                  <Badge className={getStatusColor(application.status)}>
                    {getStatusLabel(application.status)}
                  </Badge>
                  <span className="text-sm text-blue-800">to:</span>
                  <Badge className={getStatusColor(selectedStatus)}>
                    {getStatusLabel(selectedStatus)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Details */}
        <div className="space-y-3 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">
                Application ID
              </div>
              <div className="text-sm text-gray-600 font-mono">
                {application.id}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Submitted</div>
              <div className="text-sm text-gray-600">
                {formatDistanceToNow(new Date(application.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>

          {application.contractor && (
            <div>
              <div className="text-sm font-medium text-gray-700">
                Contractor
              </div>
              <div className="text-sm text-gray-600">
                {application.contractor.first_name}{' '}
                {application.contractor.last_name}
                {application.contractor.company_name && (
                  <span className="text-gray-500">
                    {' '}
                    ({application.contractor.company_name})
                  </span>
                )}
              </div>
            </div>
          )}

          {application.job && (
            <div>
              <div className="text-sm font-medium text-gray-700">Job</div>
              <div className="text-sm text-gray-600">
                {application.job.title}
              </div>
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="space-y-2 pt-4 border-t">
          <div className="text-sm font-medium text-gray-700">
            Status History
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Badge className={getStatusColor(application.status)}>
                {getStatusLabel(application.status)}
              </Badge>
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(application.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
