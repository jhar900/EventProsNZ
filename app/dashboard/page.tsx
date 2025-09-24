'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import AuthGuard from '@/components/features/auth/AuthGuard';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProfileCompletionStatus } from '@/components/features/onboarding/ProfileCompletionStatus';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { status: completionStatus, isLoading: completionLoading } =
    useProfileCompletion();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Handle logout error silently
    }
  };

  const handleCompleteProfile = () => {
    window.location.href = '/onboarding/event-manager';
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Event Pros NZ
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  New Zealand&apos;s Event Ecosystem
                </p>

                {user && (
                  <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Your Profile
                    </h2>
                    <div className="space-y-2">
                      <p>
                        <strong>Name:</strong> {user.profile?.first_name}{' '}
                        {user.profile?.last_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p>
                        <strong>Role:</strong> {user.role}
                      </p>
                      <p>
                        <strong>Verified:</strong>{' '}
                        {user.is_verified ? 'Yes' : 'No'}
                      </p>
                      {user.business_profile && (
                        <p>
                          <strong>Company:</strong>{' '}
                          {user.business_profile.company_name}
                        </p>
                      )}
                    </div>

                    {/* Profile Completion Status */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <ProfileCompletionStatus showDetails={true} />
                      {completionStatus && !completionStatus.isComplete && (
                        <div className="mt-4">
                          <Button
                            onClick={handleCompleteProfile}
                            className="w-full"
                          >
                            Complete Your Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <RoleGuard allowedRoles={['event_manager']}>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      Event Manager Dashboard
                    </h3>
                    <p className="text-blue-700 mb-4">
                      You can create and manage events, post jobs, and connect
                      with contractors.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
                        <div className="flex items-center mb-2">
                          <div className="text-2xl mr-3">📅</div>
                          <h4 className="font-medium text-gray-900">
                            Create Event
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Set up a new event and start getting quotes
                        </p>
                      </button>

                      <button className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
                        <div className="flex items-center mb-2">
                          <div className="text-2xl mr-3">🔍</div>
                          <h4 className="font-medium text-gray-900">
                            Find Contractors
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Browse available contractors for your events
                        </p>
                      </button>

                      <button className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
                        <div className="flex items-center mb-2">
                          <div className="text-2xl mr-3">📊</div>
                          <h4 className="font-medium text-gray-900">
                            My Events
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          View and manage your events
                        </p>
                      </button>

                      <button className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
                        <div className="flex items-center mb-2">
                          <div className="text-2xl mr-3">💬</div>
                          <h4 className="font-medium text-gray-900">
                            Messages
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Communicate with contractors
                        </p>
                      </button>
                    </div>
                  </div>
                </RoleGuard>

                <RoleGuard allowedRoles={['contractor']}>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Contractor Dashboard
                    </h3>
                    <p className="text-green-700">
                      You can manage your business profile, offer services, and
                      apply for jobs.
                    </p>
                  </div>
                </RoleGuard>

                <RoleGuard allowedRoles={['admin']}>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      Admin Dashboard
                    </h3>
                    <p className="text-purple-700">
                      You have administrative access to manage the platform.
                    </p>
                  </div>
                </RoleGuard>

                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="mt-4"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
