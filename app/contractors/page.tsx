'use client';

import { useAuth } from '@/hooks/useAuth';
import { ContractorDirectory } from '@/components/features/contractors/ContractorDirectory';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';

export default function ContractorsPage() {
  const { user } = useAuth();

  // If user is logged in, use DashboardLayout with sidenav
  if (user) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="py-6">
            <ContractorDirectory showFilters={true} showFeatured={true} />
          </div>
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
          <ContractorDirectory showFilters={true} showFeatured={true} />
        </div>
      </div>
    </HomepageLayout>
  );
}
