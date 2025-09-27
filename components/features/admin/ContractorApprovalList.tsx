'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Contractor {
  id: string;
  user_id: string;
  step1_completed: boolean;
  step2_completed: boolean;
  step3_completed: boolean;
  step4_completed: boolean;
  is_submitted: boolean;
  submission_date: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_date: string | null;
  admin_notes: string | null;
  users: {
    email: string;
    created_at: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  business_profiles: {
    company_name: string;
    business_address: string;
    description: string;
  };
}

export function ContractorApprovalList() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contractors');

      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors);
        setError(null);
      } else {
        setError('Failed to load contractors');
      }
    } catch (err) {
      setError('An error occurred while loading contractors');
      } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contractorId: string) => {
    setActionLoading(contractorId);
    try {
      const response = await fetch(
        `/api/admin/contractors/${contractorId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        await loadContractors();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to approve contractor');
      }
    } catch (err) {
      setError('An error occurred while approving contractor');
      } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractorId: string, reason: string) => {
    setActionLoading(contractorId);
    try {
      const response = await fetch(
        `/api/admin/contractors/${contractorId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        await loadContractors();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reject contractor');
      }
    } catch (err) {
      setError('An error occurred while rejecting contractor');
      } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  const getCompletionStatus = (contractor: Contractor) => {
    const completed = [
      contractor.step1_completed,
      contractor.step2_completed,
      contractor.step3_completed,
      contractor.step4_completed,
    ].filter(Boolean).length;

    return `${completed}/4 steps completed`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-red-600">{error}</div>
          <Button onClick={loadContractors} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const pendingContractors = contractors.filter(
    c => c.approval_status === 'pending'
  );
  const otherContractors = contractors.filter(
    c => c.approval_status !== 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingContractors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Pending Approvals ({pendingContractors.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingContractors.map(contractor => (
              <div key={contractor.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {contractor.profiles.first_name}{' '}
                        {contractor.profiles.last_name}
                      </h3>
                      {getStatusBadge(contractor.approval_status)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>{contractor.business_profiles.company_name}</p>
                      <p>{contractor.users.email}</p>
                      <p>{getCompletionStatus(contractor)}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">Business Description:</p>
                      <p>{contractor.business_profiles.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(contractor.user_id)}
                      disabled={actionLoading === contractor.user_id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === contractor.user_id
                        ? 'Approving...'
                        : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt(
                          'Please provide a reason for rejection:'
                        );
                        if (reason) {
                          handleReject(contractor.user_id, reason);
                        }
                      }}
                      disabled={actionLoading === contractor.user_id}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Contractors */}
      {otherContractors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              All Contractors ({otherContractors.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {otherContractors.map(contractor => (
              <div key={contractor.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {contractor.profiles.first_name}{' '}
                        {contractor.profiles.last_name}
                      </h3>
                      {getStatusBadge(contractor.approval_status)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>{contractor.business_profiles.company_name}</p>
                      <p>{contractor.users.email}</p>
                      <p>{getCompletionStatus(contractor)}</p>
                    </div>
                    {contractor.admin_notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Admin Notes:</p>
                        <p>{contractor.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contractor.approval_date && (
                      <p>
                        {contractor.approval_status === 'approved'
                          ? 'Approved'
                          : 'Rejected'}{' '}
                        on{' '}
                        {new Date(
                          contractor.approval_date
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {contractors.length === 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 text-center">
            <p className="text-gray-500">No contractors found.</p>
          </div>
        </div>
      )}
    </div>
  );
}
