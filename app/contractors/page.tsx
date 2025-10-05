'use client';

import { Metadata } from 'next';
import { useAuth } from '@/hooks/useAuth';
import { ContractorDirectory } from '@/components/features/contractors/ContractorDirectory';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'Contractor Directory | EventPros NZ',
  description:
    'Find verified contractors for your next event. Browse our comprehensive directory of professional event service providers.',
  keywords:
    'contractors, event services, catering, photography, venue, planning, New Zealand',
  openGraph: {
    title: 'Contractor Directory | EventPros NZ',
    description:
      'Find verified contractors for your next event. Browse our comprehensive directory of professional event service providers.',
    type: 'website',
  },
};

export default function ContractorsPage() {
  const { user } = useAuth();

  // If user is logged in, use DashboardLayout with sidenav
  if (user) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <ContractorDirectory showFilters={true} showFeatured={true} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If user is not logged in, show the page without sidenav
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ContractorDirectory showFilters={true} showFeatured={true} />
      </div>
    </div>
  );
}
