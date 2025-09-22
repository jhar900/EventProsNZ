'use client';

import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface ProfileCompletionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ProfileCompletionStatus({
  showDetails = false,
  className = '',
}: ProfileCompletionStatusProps) {
  const { status, isLoading, error } = useProfileCompletion();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading profile status
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Complete';
    if (percentage >= 75) return 'Almost Complete';
    if (percentage >= 50) return 'In Progress';
    return 'Getting Started';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Profile Completion
        </span>
        <span
          className={`text-sm font-medium ${getStatusColor(status.completionPercentage)}`}
        >
          {status.completionPercentage}% -{' '}
          {getStatusText(status.completionPercentage)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            status.completionPercentage >= 100
              ? 'bg-green-500'
              : status.completionPercentage >= 75
                ? 'bg-blue-500'
                : status.completionPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
          }`}
          style={{ width: `${status.completionPercentage}%` }}
        />
      </div>

      {showDetails && status.missingFields.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">Still needed:</p>
          <ul className="text-sm text-gray-500 space-y-1">
            {status.missingFields.map((field, index) => (
              <li key={index} className="flex items-center">
                <span className="text-red-500 mr-2">•</span>
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                status.requirements.personalInfo
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Personal Info</span>
          </div>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                status.requirements.contactInfo ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Contact Info</span>
          </div>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                status.requirements.businessInfo
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Business Info</span>
          </div>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                status.requirements.profilePhoto
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Profile Photo</span>
          </div>
        </div>
      )}
    </div>
  );
}
