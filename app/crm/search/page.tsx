import { Metadata } from 'next';
import { ContactSearch } from '@/components/features/crm/ContactSearch';

export const metadata: Metadata = {
  title: 'Contact Search | EventProsNZ CRM',
  description: 'Search and filter your contacts.',
};

export default function SearchPage() {
  return (
    <div className="container mx-auto py-6">
      <ContactSearch />
    </div>
  );
}
