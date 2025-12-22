'use client';

import { useAuth } from '@/hooks/useAuth';
import { ContractorDirectory } from '@/components/features/contractors/ContractorDirectory';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import { useSearchParams } from 'next/navigation';
import { ContractorFilters } from '@/types/contractors';
import { useMemo, Suspense } from 'react';

function ContractorsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Parse URL parameters and convert to initialFilters
  const initialFilters = useMemo<ContractorFilters>(() => {
    const filters: ContractorFilters = {};

    // Parse service_types from URL (comma-separated)
    const serviceTypesParam = searchParams.get('service_types');
    if (serviceTypesParam) {
      filters.serviceTypes = serviceTypesParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    // Parse other potential filters
    const location = searchParams.get('location');
    if (location) {
      filters.location = location;
    }

    const q = searchParams.get('q');
    if (q) {
      filters.q = q;
    }

    return filters;
  }, [searchParams]);

  // If user is logged in, use DashboardLayout with sidenav
  if (user) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="py-6">
            <ContractorDirectory
              initialFilters={initialFilters}
              showFilters={true}
              showFeatured={true}
            />
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
          <ContractorDirectory
            initialFilters={initialFilters}
            showFilters={true}
            showFeatured={true}
          />
        </div>
      </div>
    </HomepageLayout>
  );
}

export default function ContractorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <ContractorsContent />
    </Suspense>
  );
}
