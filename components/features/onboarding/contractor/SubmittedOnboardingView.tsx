'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SubmittedOnboardingViewProps {
  status: {
    step1_completed: boolean;
    step2_completed: boolean;
    step3_completed: boolean;
    step4_completed: boolean;
    is_submitted: boolean;
    approval_status: 'pending' | 'approved' | 'rejected';
    submission_date?: string;
    approval_date?: string;
    admin_notes?: string;
  };
}

export function SubmittedOnboardingView({
  status,
}: SubmittedOnboardingViewProps) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmittedData = async () => {
      if (!user?.id) return;

      try {
        // Load personal profile
        const profileResponse = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          setProfileData(profileResult.profile);
        }

        // Load business profile
        const businessResponse = await fetch('/api/user/business-profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (businessResponse.ok) {
          const businessResult = await businessResponse.json();
          setBusinessData(
            businessResult.businessProfile || businessResult.business_profile
          );
        }

        // Load services
        const servicesResponse = await fetch('/api/user/services', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (servicesResponse.ok) {
          const servicesResult = await servicesResponse.json();
          setServices(servicesResult.services || []);
        }
      } catch (error) {
        console.error('Failed to load submitted data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubmittedData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading your submitted information...</p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (status.approval_status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Onboarding Information
            </h1>
            <p className="text-gray-600">
              View your submitted contractor profile information
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {status.submission_date && (
          <p className="text-sm text-gray-500">
            Submitted on:{' '}
            {new Date(status.submission_date).toLocaleDateString('en-NZ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        {status.step1_completed && profileData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">First Name</p>
                <p className="text-gray-900">
                  {profileData.first_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Name</p>
                <p className="text-gray-900">
                  {profileData.last_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-900">{profileData.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{profileData.address || 'N/A'}</p>
              </div>
            </div>
            {profileData.avatar_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Profile Photo
                </p>
                <img
                  src={profileData.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Business Information */}
        {status.step2_completed && businessData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Company Name
                </p>
                <p className="text-gray-900">
                  {businessData.company_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-gray-900">
                  {businessData.location ||
                    businessData.business_address ||
                    'N/A'}
                </p>
              </div>
              {businessData.website && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <a
                    href={businessData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {businessData.website}
                  </a>
                </div>
              )}
              {businessData.nzbn && (
                <div>
                  <p className="text-sm font-medium text-gray-500">NZBN</p>
                  <p className="text-gray-900">{businessData.nzbn}</p>
                </div>
              )}
              {businessData.service_categories &&
                businessData.service_categories.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Service Categories
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {businessData.service_categories.map(
                        (category: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {category}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              {businessData.service_areas &&
                businessData.service_areas.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Service Areas
                    </p>
                    <p className="text-gray-900">
                      {businessData.service_areas.includes('Nationwide')
                        ? 'Nationwide coverage'
                        : businessData.service_areas.join(', ')}
                    </p>
                  </div>
                )}
            </div>
            {businessData.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{businessData.description}</p>
              </div>
            )}
            {businessData.logo_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Company Logo
                </p>
                <img
                  src={businessData.logo_url}
                  alt="Company Logo"
                  className="w-32 h-32 object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Services & Pricing */}
        {status.step3_completed && services.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Services & Pricing
            </h2>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {service.service_name || 'Service'}
                    </h3>
                    {service.service_type && (
                      <span className="text-sm text-gray-500">
                        {service.service_type}
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-gray-700 mb-2">{service.description}</p>
                  )}
                  {(service.price_range_min || service.price_range_max) && (
                    <p className="text-sm text-gray-600">
                      Price Range: NZD{' '}
                      {service.price_range_min
                        ? `$${service.price_range_min}`
                        : 'N/A'}
                      {' - '}
                      {service.price_range_max
                        ? `$${service.price_range_max}`
                        : 'N/A'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publicity Information */}
        {status.step4_completed && businessData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Publicity Information
            </h2>
            {businessData.community_goals && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">
                  Community Goals
                </p>
                <p className="text-gray-900 mt-1">
                  {businessData.community_goals}
                </p>
              </div>
            )}
            {businessData.questions && (
              <div>
                <p className="text-sm font-medium text-gray-500">Questions</p>
                <p className="text-gray-900 mt-1">{businessData.questions}</p>
              </div>
            )}
          </div>
        )}

        {/* Admin Notes (if rejected) */}
        {status.approval_status === 'rejected' && status.admin_notes && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Admin Notes
            </h3>
            <p className="text-red-700">{status.admin_notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

