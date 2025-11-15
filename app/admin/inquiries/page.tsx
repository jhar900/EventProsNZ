import { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ContractorInquiriesList from '@/components/features/inquiries/ContractorInquiriesList';
import RoleGuard from '@/components/features/auth/RoleGuard';

export const metadata: Metadata = {
  title: 'Admin - Inquiries | EventProsNZ',
  description: 'View and manage all inquiries across the platform',
};

export default function AdminInquiriesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Platform Inquiries
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View and manage all inquiries across the platform
              </p>
            </div>
            <ContractorInquiriesList compact={true} />
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
