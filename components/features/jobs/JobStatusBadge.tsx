'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { JobStatus } from '@/types/jobs';

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function JobStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: JobStatusBadgeProps) {
  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: CheckCircle,
        };
      case 'filled':
        return {
          label: 'Filled',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          icon: CheckCircle,
        };
      case 'completed':
        return {
          label: 'Completed',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          icon: XCircle,
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: AlertCircle,
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-4 py-2';
      default:
        return 'text-sm px-3 py-1';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = getSizeClasses(size);

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses} flex items-center gap-1`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
