'use client';

import { useContractorOnboarding } from '@/hooks/useContractorOnboarding';

interface ProfileCompletionTrackerProps {
  className?: string;
}

export function ProfileCompletionTracker({
  className = '',
}: ProfileCompletionTrackerProps) {
  const { progress, status, loading } = useContractorOnboarding();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusText = () => {
    if (status.is_submitted) {
      switch (status.approval_status) {
        case 'approved':
          return 'Profile approved and active';
        case 'rejected':
          return 'Profile rejected - please review and resubmit';
        case 'pending':
        default:
          return 'Profile submitted for approval';
      }
    }

    if (progress.completedSteps === 4) {
      return 'Profile complete - ready to submit';
    }

    return `Complete ${4 - progress.completedSteps} more step${4 - progress.completedSteps === 1 ? '' : 's'}`;
  };

  const getStatusColor = () => {
    if (status.is_submitted) {
      switch (status.approval_status) {
        case 'approved':
          return 'text-green-600 bg-green-100';
        case 'rejected':
          return 'text-red-600 bg-red-100';
        case 'pending':
        default:
          return 'text-yellow-600 bg-yellow-100';
      }
    }

    if (progress.completedSteps === 4) {
      return 'text-blue-600 bg-blue-100';
    }

    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Profile Completion
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress.completionPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.completionPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Personal Information</span>
          <span
            className={
              status.step1_completed ? 'text-green-600' : 'text-gray-400'
            }
          >
            {status.step1_completed ? '✓' : '○'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Business Information</span>
          <span
            className={
              status.step2_completed ? 'text-green-600' : 'text-gray-400'
            }
          >
            {status.step2_completed ? '✓' : '○'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Services & Pricing</span>
          <span
            className={
              status.step3_completed ? 'text-green-600' : 'text-gray-400'
            }
          >
            {status.step3_completed ? '✓' : '○'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Portfolio</span>
          <span
            className={
              status.step4_completed ? 'text-green-600' : 'text-gray-400'
            }
          >
            {status.step4_completed ? '✓' : '○'}
          </span>
        </div>
      </div>

      {status.admin_notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Admin Notes
          </h4>
          <p className="text-sm text-gray-600">{status.admin_notes}</p>
        </div>
      )}

      {status.submission_date && (
        <div className="mt-4 text-xs text-gray-500">
          Submitted: {new Date(status.submission_date).toLocaleDateString()}
        </div>
      )}

      {status.approval_date && (
        <div className="mt-1 text-xs text-gray-500">
          {status.approval_status === 'approved' ? 'Approved' : 'Rejected'}:{' '}
          {new Date(status.approval_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
