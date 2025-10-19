import { Metadata } from 'next';
import { ContactExport } from '@/components/features/crm/ContactExport';

export const metadata: Metadata = {
  title: 'Contact Export | EventProsNZ CRM',
  description: 'Export your contact data in various formats.',
};

export default function ExportPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ContactExport />
    </div>
  );
}
