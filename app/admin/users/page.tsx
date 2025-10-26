'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/features/admin/UserManagement';

export default function AdminUsersPage() {
  const { user } = useAuth();

  // In development mode, bypass RoleGuard to allow access
  if (process.env.NODE_ENV === 'development') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
                <p className="text-yellow-800 text-sm">
                  <strong>Development Mode:</strong> Admin access bypassed for
                  development purposes.
                </p>
              </div>
              <UserManagement />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Production mode: Use RoleGuard
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <UserManagement />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
