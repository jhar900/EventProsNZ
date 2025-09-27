'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/features/auth/AuthGuard';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserDetails {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  status: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    profile_photo_url: string;
    bio: string;
    preferences: any;
  } | null;
  business_profiles: {
    company_name: string;
    subscription_tier: string;
    services: string[];
    website: string;
    description: string;
  } | null;
}

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadUserDetails();
      loadUserActivity();
    }
  }, [params.id]);

  const loadUserDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${params.id}`);
      const result = await response.json();

      if (response.ok) {
        setUserDetails(result.user);
      } else {
        throw new Error(result.error || 'Failed to load user details');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load user details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserActivity = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/activity`);
      const result = await response.json();

      if (response.ok) {
        setActivities(result.activities || []);
      }
    } catch (err) {
      }
  };

  const handleVerifyUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/verify`, {
        method: 'POST',
      });
      const result = await response.json();

      if (response.ok) {
        await loadUserDetails();
        alert('User verified successfully');
      } else {
        throw new Error(result.error || 'Failed to verify user');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify user');
    }
  };

  const handleSuspendUser = async () => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/users/${params.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();

      if (response.ok) {
        await loadUserDetails();
        alert('User suspended successfully');
      } else {
        throw new Error(result.error || 'Failed to suspend user');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleChangeRole = async () => {
    if (!userDetails) return;

    const newRole = prompt(
      `Current role: ${userDetails.role}\nEnter new role (admin, event_manager, contractor):`
    );
    if (
      !newRole ||
      !['admin', 'event_manager', 'contractor'].includes(newRole)
    ) {
      alert('Invalid role');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${params.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();

      if (response.ok) {
        await loadUserDetails();
        alert('User role updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update user role');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'event_manager':
        return 'bg-blue-100 text-blue-800';
      case 'contractor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string, isVerified: boolean) => {
    if (status === 'suspended') return 'bg-red-100 text-red-800';
    if (isVerified) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading user details...</span>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (error || !userDetails) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'User not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => router.back()}
                  className="mb-4 text-blue-600 hover:text-blue-800"
                >
                  ← Back to Users
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                  User Details
                </h1>
                <p className="mt-2 text-gray-600">
                  {userDetails.profiles?.first_name &&
                  userDetails.profiles?.last_name
                    ? `${userDetails.profiles.first_name} ${userDetails.profiles.last_name}`
                    : userDetails.email}
                </p>
              </div>

              {/* User Info Card */}
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        {userDetails.profiles?.profile_photo_url ? (
                          <img
                            className="h-16 w-16 rounded-full"
                            src={userDetails.profiles.profile_photo_url}
                            alt=""
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xl font-medium text-gray-700">
                              {userDetails.profiles?.first_name?.charAt(0) ||
                                userDetails.email.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {userDetails.profiles?.first_name &&
                          userDetails.profiles?.last_name
                            ? `${userDetails.profiles.first_name} ${userDetails.profiles.last_name}`
                            : 'No Name'}
                        </h2>
                        <p className="text-gray-600">{userDetails.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(userDetails.role)}`}
                      >
                        {userDetails.role.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(userDetails.status, userDetails.is_verified)}`}
                      >
                        {userDetails.status === 'suspended'
                          ? 'Suspended'
                          : userDetails.is_verified
                            ? 'Verified'
                            : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Account Information
                      </h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Email
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Role
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.role.replace('_', ' ')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Status
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.status}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Last Login
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.last_login
                              ? new Date(
                                  userDetails.last_login
                                ).toLocaleString()
                              : 'Never'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Member Since
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(
                              userDetails.created_at
                            ).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Profile Information
                      </h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Phone
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.profiles?.phone || 'Not provided'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Address
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {userDetails.profiles?.address || 'Not provided'}
                          </dd>
                        </div>
                        {userDetails.business_profiles && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Company
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {userDetails.business_profiles.company_name}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Subscription
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {
                                  userDetails.business_profiles
                                    .subscription_tier
                                }
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleVerifyUser}
                      disabled={userDetails.is_verified}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        userDetails.is_verified
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {userDetails.is_verified ? 'Verified' : 'Verify User'}
                    </button>
                    <button
                      onClick={handleSuspendUser}
                      disabled={userDetails.status === 'suspended'}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        userDetails.status === 'suspended'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {userDetails.status === 'suspended'
                        ? 'Suspended'
                        : 'Suspend User'}
                    </button>
                    <button
                      onClick={handleChangeRole}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Change Role
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Activity
                  </h3>
                </div>
                <div className="px-6 py-4">
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div
                          key={activity.id}
                          className="border-l-4 border-blue-400 pl-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-gray-600 mt-1">
                              {JSON.stringify(activity.details, null, 2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No activity found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
