import { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ContractorInquiriesList from '@/components/features/inquiries/ContractorInquiriesList';

export const metadata: Metadata = {
  title: 'Inquiries | EventProsNZ',
  description: 'View and manage inquiries sent to you',
};

export default function InquiriesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pt-16 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <ContractorInquiriesList />
        </div>
      </div>
    </DashboardLayout>
  );
}
