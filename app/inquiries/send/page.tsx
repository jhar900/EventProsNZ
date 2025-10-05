import { Metadata } from 'next';
import { StructuredInquiry } from '@/components/features/inquiries/StructuredInquiry';

export const metadata: Metadata = {
  title: 'Send Inquiry | EventProsNZ',
  description: 'Send a structured inquiry to contractors',
};

export default function SendInquiryPage() {
  return (
    <div className="container mx-auto py-8">
      <StructuredInquiry />
    </div>
  );
}
