'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  StarIcon,
  CogIcon,
  StarIcon as CrownIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface VerificationBadge {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
}

interface VerificationStatus {
  isVerified: boolean;
  verificationDate?: string;
  badges: VerificationBadge[];
  metrics: {
    portfolioCount: number;
    reviewCount: number;
    serviceCount: number;
    accountAge: number;
  };
}

interface VerificationBadgesProps {
  contractorId: string;
  className?: string;
}

const iconMap = {
  'check-circle': CheckCircleIcon,
  'building-office': BuildingOfficeIcon,
  photo: PhotoIcon,
  star: StarIcon,
  cog: CogIcon,
  crown: CrownIcon,
  clock: ClockIcon,
  'information-circle': InformationCircleIcon,
};

const colorClasses = {
  green: 'bg-green-100 text-green-800 border-green-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  gold: 'bg-yellow-200 text-yellow-900 border-yellow-300',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function VerificationBadges({
  contractorId,
  className = '',
}: VerificationBadgesProps) {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        const response = await fetch(
          `/api/contractors/${contractorId}/verification`
        );
        const data = await response.json();

        if (response.ok) {
          setVerificationStatus(data.verificationStatus);
        } else {
          setError(data.error || 'Failed to load verification status');
        }
      } catch (error) {
        setError('Network error loading verification status');
      } finally {
        setLoading(false);
      }
    };

    loadVerificationStatus();
  }, [contractorId]);

  const getIcon = (iconName: string) => {
    const IconComponent =
      iconMap[iconName as keyof typeof iconMap] || InformationCircleIcon;
    return IconComponent;
  };

  const getColorClass = (color: string) => {
    return (
      colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2 text-sm">
            Loading verification status...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-4">
          <InformationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!verificationStatus || verificationStatus.badges.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verification Status
        </h3>
        <div className="text-center py-4">
          <InformationCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">
            No verification badges available
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`verification-badges ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Verification & Trust
          </h3>
          {verificationStatus.isVerified && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Primary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {verificationStatus.badges.slice(0, 6).map(badge => {
            const IconComponent = getIcon(badge.icon);
            const colorClass = getColorClass(badge.color);

            return (
              <div
                key={badge.type}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                title={badge.description}
              >
                <div className={`p-2 rounded-full ${colorClass} mr-3`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {badge.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Details */}
        {verificationStatus.verificationDate && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Business Verified
                </p>
                <p className="text-xs text-green-600">
                  Verified on {formatDate(verificationStatus.verificationDate)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {verificationStatus.metrics.portfolioCount}
            </div>
            <div className="text-xs text-gray-600">Portfolio Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {verificationStatus.metrics.reviewCount}
            </div>
            <div className="text-xs text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {verificationStatus.metrics.serviceCount}
            </div>
            <div className="text-xs text-gray-600">Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {verificationStatus.metrics.accountAge}
            </div>
            <div className="text-xs text-gray-600">Days Active</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Trust & Safety
              </p>
              <p className="text-xs text-blue-600">
                This contractor has been verified by EventPros NZ. All business
                information, portfolio items, and reviews are authentic and
                regularly monitored.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
