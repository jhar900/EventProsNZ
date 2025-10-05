import { Metadata } from 'next';
import { StructuredInquiry } from '@/components/features/inquiries/StructuredInquiry';

export const metadata: Metadata = {
  title: 'Inquiry Status | EventProsNZ',
  description: 'Track the status of your inquiries',
};

export default function InquiryStatusPage() {
  return (
    <div className="container mx-auto py-8">
      <StructuredInquiry />
    </div>
  );
}
