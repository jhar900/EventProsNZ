import { Metadata } from 'next';
import { StructuredInquiry } from '@/components/features/inquiries/StructuredInquiry';

export const metadata: Metadata = {
  title: 'Inquiries | EventProsNZ',
  description: 'Manage and track your contractor inquiries',
};

export default function InquiriesPage() {
  return (
    <div className="container mx-auto py-8">
      <StructuredInquiry />
    </div>
  );
}
