import { Metadata } from 'next';
import { StructuredInquiry } from '@/components/features/inquiries/StructuredInquiry';

export const metadata: Metadata = {
  title: 'Inquiry Templates | EventProsNZ',
  description: 'Manage your inquiry response templates',
};

export default function InquiryTemplatesPage() {
  return (
    <div className="container mx-auto py-8">
      <StructuredInquiry />
    </div>
  );
}
