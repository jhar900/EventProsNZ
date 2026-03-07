import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FAQManagement from '@/components/features/admin/FAQManagement';

export default function AdminFAQPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                FAQ Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage public FAQs. Add, edit, reorder, and toggle visibility.
              </p>
            </div>
            <FAQManagement />
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
