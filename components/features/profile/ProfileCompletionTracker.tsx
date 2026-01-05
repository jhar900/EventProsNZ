'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface ProfileCompletionTrackerProps {
  className?: string;
}

export default function ProfileCompletionTracker({
  className = '',
}: ProfileCompletionTrackerProps) {
  const { completionStatus, isLoading, loadProfileData } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  // Load profile data when component mounts to calculate completion status
  React.useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  if (isLoading || !completionStatus) {
    return null; // Don't show anything while loading
  }

  const completionItems = [
    {
      key: 'personal_info',
      label: 'Personal Information',
      completed: completionStatus.personal_info,
      description: 'First name, last name, and basic details',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      completed: completionStatus.contact_info,
      description: 'Phone number and address',
    },
    {
      key: 'business_info',
      label: 'Business Information',
      completed: completionStatus.business_info,
      description: 'Company name and business description',
    },
    {
      key: 'services',
      label: 'Services',
      completed: completionStatus.services,
      description: 'At least one service offering',
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      completed: completionStatus.portfolio,
      description: 'At least 3 portfolio items',
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-label={
          isOpen ? 'Collapse profile completion' : 'Expand profile completion'
        }
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Profile Completion
            </h3>
            <span
              className={`text-sm font-medium ${getProgressTextColor(completionStatus.overall_completion)}`}
            >
              {completionStatus.overall_completion}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(completionStatus.overall_completion)}`}
              style={{ width: `${completionStatus.overall_completion}%` }}
            />
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-gray-600">
            Complete your profile to increase your visibility and attract more
            clients.
          </p>

          <div className="space-y-4">
            {completionItems.map(item => (
              <div key={item.key} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {completionStatus.overall_completion < 100 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Complete your profile
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    A complete profile helps clients find and trust you.
                    Complete the missing sections above to improve your profile
                    visibility.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
