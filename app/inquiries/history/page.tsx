import { Metadata } from 'next';
import { StructuredInquiry } from '@/components/features/inquiries/StructuredInquiry';

export const metadata: Metadata = {
  title: 'Inquiry History | EventProsNZ',
  description: 'View and manage your inquiry history',
};

export default function InquiryHistoryPage() {
  return (
    <div className="container mx-auto py-8">
      <StructuredInquiry />
    </div>
  );
}
