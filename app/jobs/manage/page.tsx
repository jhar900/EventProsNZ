'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/features/auth/RoleGuard';
import { EventManagerJobManagement } from '@/components/features/jobs/EventManagerJobManagement';

export default function ManageJobsPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['event_manager']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {user?.id && <EventManagerJobManagement userId={user.id} />}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
