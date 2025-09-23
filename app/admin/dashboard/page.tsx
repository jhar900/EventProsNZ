'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboard from '@/components/features/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <AdminDashboard />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
