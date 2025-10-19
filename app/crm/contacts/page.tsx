import { Metadata } from 'next';
import { ContactManagement } from '@/components/features/crm/ContactManagement';

export const metadata: Metadata = {
  title: 'Contact Management | EventProsNZ CRM',
  description: 'Manage your business contacts and relationships.',
};

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-6">
      <ContactManagement />
    </div>
  );
}
