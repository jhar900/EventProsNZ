import { Metadata } from 'next';
import { BasicCRM } from '@/components/features/crm/BasicCRM';

export const metadata: Metadata = {
  title: 'CRM Dashboard | EventProsNZ',
  description:
    'Manage your business relationships and interactions with our comprehensive CRM system.',
};

export default function CRMPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <BasicCRM />
    </div>
  );
}
