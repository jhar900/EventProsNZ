'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { VerificationQueue } from '@/components/features/admin/verification/VerificationQueue';
import { UserVerificationCard } from '@/components/features/admin/verification/UserVerificationCard';
import { VerificationAnalytics } from '@/components/features/admin/verification/VerificationAnalytics';
import { VerificationSummaryCards } from '@/components/features/admin/verification/VerificationSummaryCards';
import { Button } from '@/components/ui/button';
import { BarChart3, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'onboarding';
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    bio?: string;
    profile_photo_url?: string;
  };
  business_profiles?: {
    company_name: string;
    business_address?: string;
    nzbn?: string;
    description?: string;
    service_areas?: string[];
    social_links?: Record<string, string>;
    is_verified: boolean;
    verification_date?: string;
  };
}

interface VerificationLog {
  id: string;
  action: string;
  status: string;
  reason?: string;
  created_at: string;
  admin_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function VerificationPage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verificationLog, setVerificationLog] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'queue' | 'analytics'>('queue');
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);

  const handleUserSelect = async (user: User) => {
    const queueVerificationStatus = (user as any).verification_status;
    setSelectedUser(user);
    setVerificationLog([]);

    try {
      const response = await fetch(`/api/admin/verification/${user.id}`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const updatedUser = data.user as User;
          if (
            queueVerificationStatus &&
            (!updatedUser.verification_status ||
              updatedUser.verification_status === 'pending')
          ) {
            if (
              queueVerificationStatus === 'rejected' ||
              queueVerificationStatus === 'approved'
            ) {
              (updatedUser as any).verification_status =
                queueVerificationStatus;
            }
          }
          setSelectedUser(updatedUser);
        }
        setVerificationLog(data.verification_log || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch user details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleApprove = async (userId: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/verification/${userId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': 'admin-secure-token-2024-eventpros',
          },
          body: JSON.stringify({ reason }),
          credentials: 'include', // Include cookies for authentication
        }
      );

      if (response.ok) {
        if (selectedUser) {
          await handleUserSelect({ ...selectedUser, is_verified: true });
        }
        setTimeout(() => {
          setQueueRefreshKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await response.json();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (
    userId: string,
    reason: string,
    feedback?: string
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/verification/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify({ reason, feedback }),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        if (selectedUser) {
          await handleUserSelect(selectedUser);
        }
        setTimeout(() => {
          setQueueRefreshKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await response.json();
        console.error('Rejection failed:', error);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubmit = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/verification/${userId}/resubmit`,
        {
          method: 'POST',
          headers: {
            'x-admin-token': 'admin-secure-token-2024-eventpros',
          },
          credentials: 'include', // Include cookies for authentication
        }
      );

      if (response.ok) {
        if (selectedUser) {
          await handleUserSelect(selectedUser);
        }
        setTimeout(() => {
          setQueueRefreshKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await response.json();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnapprove = async (userId: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/verification/${userId}/unapprove`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': 'admin-secure-token-2024-eventpros',
          },
          body: JSON.stringify({ reason }),
          credentials: 'include', // Include cookies for authentication
        }
      );

      if (response.ok) {
        if (selectedUser) {
          await handleUserSelect(selectedUser);
        }
        setTimeout(() => {
          setQueueRefreshKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await response.json();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      User Verification
                    </h1>
                    <p className="text-gray-600">
                      Review and approve user accounts and business profiles
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={view === 'queue' ? 'default' : 'outline'}
                      onClick={() => setView('queue')}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Verification Queue
                    </Button>
                    <Button
                      variant={view === 'analytics' ? 'default' : 'outline'}
                      onClick={() => setView('analytics')}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </div>

              {view === 'queue' && (
                <div className="space-y-6">
                  <VerificationSummaryCards refreshKey={queueRefreshKey} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <VerificationQueue
                        key={queueRefreshKey}
                        onUserSelect={handleUserSelect}
                      />
                    </div>
                    <div>
                      {selectedUser ? (
                        <UserVerificationCard
                          user={selectedUser}
                          verificationLog={verificationLog}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onResubmit={handleResubmit}
                          onUnapprove={handleUnapprove}
                          isLoading={isLoading}
                        />
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Select a User
                          </h3>
                          <p className="text-gray-600">
                            Choose a user from the queue to review their
                            verification details
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === 'analytics' && <VerificationAnalytics />}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
