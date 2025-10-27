'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ContractorProfile } from '@/components/features/contractors/ContractorProfile';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';

export default function ContractorProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const contractorId = params.id as string;

  // If user is logged in, use DashboardLayout with sidenav
  if (user) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ContractorProfile contractorId={contractorId} />
        </div>
      </DashboardLayout>
    );
  }

  // If user is not logged in, show the page without sidenav
  return (
    <HomepageLayout className="min-h-screen bg-gray-50">
      {/* Content with top padding to account for fixed navigation */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ContractorProfile contractorId={contractorId} />
        </div>
      </div>
    </HomepageLayout>
  );
}
