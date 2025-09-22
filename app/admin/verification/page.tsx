'use client';

import { useState } from 'react';
import { VerificationQueue } from '@/components/features/admin/verification/VerificationQueue';
import { UserVerificationCard } from '@/components/features/admin/verification/UserVerificationCard';
import { VerificationAnalytics } from '@/components/features/admin/verification/VerificationAnalytics';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verificationLog, setVerificationLog] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'queue' | 'analytics'>('queue');

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/verification/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationLog(data.verification_log);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
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
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        // Refresh the user data
        if (selectedUser) {
          handleUserSelect({ ...selectedUser, is_verified: true });
        }
        // You might want to refresh the queue here
      } else {
        const error = await response.json();
        console.error('Failed to approve user:', error);
      }
    } catch (error) {
      console.error('Error approving user:', error);
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
        },
        body: JSON.stringify({ reason, feedback }),
      });

      if (response.ok) {
        // Refresh the user data
        if (selectedUser) {
          handleUserSelect({ ...selectedUser, is_verified: false });
        }
        // You might want to refresh the queue here
      } else {
        const error = await response.json();
        console.error('Failed to reject user:', error);
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
        }
      );

      if (response.ok) {
        // Refresh the user data
        if (selectedUser) {
          handleUserSelect(selectedUser);
        }
      } else {
        const error = await response.json();
        console.error('Failed to resubmit user:', error);
      }
    } catch (error) {
      console.error('Error resubmitting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <VerificationQueue onUserSelect={handleUserSelect} />
          </div>
          <div>
            {selectedUser ? (
              <UserVerificationCard
                user={selectedUser}
                verificationLog={verificationLog}
                onApprove={handleApprove}
                onReject={handleReject}
                onResubmit={handleResubmit}
                isLoading={isLoading}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a User
                </h3>
                <p className="text-gray-600">
                  Choose a user from the queue to review their verification
                  details
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'analytics' && <VerificationAnalytics />}
    </div>
  );
}
