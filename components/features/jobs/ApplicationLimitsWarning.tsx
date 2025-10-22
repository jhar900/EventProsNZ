'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useApplicationLimits } from '@/hooks/useApplicationLimits';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationLimitsWarningProps {
  jobServiceCategory?: string;
  onUpgrade?: () => void;
  className?: string;
}

export function ApplicationLimitsWarning({
  jobServiceCategory,
  onUpgrade,
  className = '',
}: ApplicationLimitsWarningProps) {
  const {
    limits,
    restrictions,
    currentServiceCategory,
    isLoading,
    error,
    canApply,
    getRemainingApplications,
    canChangeServiceCategory,
  } = useApplicationLimits();

  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">
            Loading application limits...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load application limits: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!limits) {
    return null;
  }

  const remainingApplications = getRemainingApplications();
  const isLowLimit = remainingApplications > 0 && remainingApplications <= 2;
  const isAtLimit = remainingApplications === 0;
  const isUnlimited = remainingApplications === -1;

  // Check if service category matches
  const serviceCategoryMatches =
    !jobServiceCategory || currentServiceCategory === jobServiceCategory;
  const serviceCategoryMismatch =
    jobServiceCategory && currentServiceCategory !== jobServiceCategory;

  // Determine warning level
  const getWarningLevel = () => {
    if (serviceCategoryMismatch) return 'error';
    if (isAtLimit) return 'error';
    if (isLowLimit) return 'warning';
    return 'info';
  };

  const warningLevel = getWarningLevel();

  const getWarningMessage = () => {
    if (serviceCategoryMismatch) {
      return `You can only apply to ${currentServiceCategory} jobs. This job requires ${jobServiceCategory}.`;
    }

    if (isAtLimit) {
      return `You've reached your monthly application limit (${limits.monthly_limit}). Your limit resets on ${new Date(limits.reset_date).toLocaleDateString()}.`;
    }

    if (isLowLimit) {
      return `You have ${remainingApplications} applications remaining this month.`;
    }

    if (isUnlimited) {
      return `You have unlimited applications with your ${limits.tier_name} subscription.`;
    }

    return `You have ${remainingApplications} applications remaining this month.`;
  };

  const getWarningIcon = () => {
    switch (warningLevel) {
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    }
  };

  const getWarningColor = () => {
    switch (warningLevel) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Warning */}
      <Card className={`p-4 border ${getWarningColor()}`}>
        <div className="flex items-start space-x-3">
          {getWarningIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {getWarningMessage()}
            </p>

            {/* Service Category Mismatch */}
            {serviceCategoryMismatch && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  To apply to {jobServiceCategory} jobs, you need to change your
                  service category.
                </p>
                {!canChangeServiceCategory() &&
                  restrictions?.next_change_allowed_at && (
                    <p className="text-sm text-gray-500">
                      You can change your service category on{' '}
                      {new Date(
                        restrictions.next_change_allowed_at
                      ).toLocaleDateString()}
                      .
                    </p>
                  )}
                {canChangeServiceCategory() && (
                  <Button size="sm" variant="outline" className="mt-2">
                    Change Service Category
                  </Button>
                )}
              </div>
            )}

            {/* Upgrade Option */}
            {isAtLimit && onUpgrade && (
              <div className="mt-2">
                <Button size="sm" onClick={onUpgrade} className="mr-2">
                  Upgrade Subscription
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  View Details
                </Button>
              </div>
            )}

            {/* Low Limit Warning */}
            {isLowLimit && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  View Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Detailed Information */}
      {showDetails && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Application Limits
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(false)}
              >
                Hide Details
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subscription Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{limits.tier_name}</Badge>
                  <span className="text-sm text-gray-600">Subscription</span>
                </div>
                <div className="text-sm text-gray-600">
                  Monthly limit:{' '}
                  {isUnlimited ? 'Unlimited' : limits.monthly_limit}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    Usage
                  </span>
                  <span className="text-sm text-gray-600">
                    {limits.used} / {isUnlimited ? '∞' : limits.monthly_limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isAtLimit
                        ? 'bg-red-500'
                        : isLowLimit
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: isUnlimited
                        ? '100%'
                        : `${(limits.used / limits.monthly_limit) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Reset Date */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>
                Resets{' '}
                {formatDistanceToNow(new Date(limits.reset_date), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Service Category Info */}
            {currentServiceCategory && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  Current Service Category
                </div>
                <Badge variant="outline">
                  {currentServiceCategory.replace('_', ' ').toUpperCase()}
                </Badge>
                {!canChangeServiceCategory() &&
                  restrictions?.next_change_allowed_at && (
                    <div className="text-sm text-gray-500">
                      Next change allowed:{' '}
                      {new Date(
                        restrictions.next_change_allowed_at
                      ).toLocaleDateString()}
                    </div>
                  )}
              </div>
            )}

            {/* Upgrade CTA */}
            {!isUnlimited && onUpgrade && (
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">
                  Need more applications? Upgrade your subscription for
                  unlimited applications.
                </div>
                <Button size="sm" onClick={onUpgrade}>
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
