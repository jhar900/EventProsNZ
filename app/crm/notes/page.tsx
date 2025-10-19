import { Metadata } from 'next';
import { NotesAndTags } from '@/components/features/crm/NotesAndTags';

export const metadata: Metadata = {
  title: 'Notes & Tags | EventProsNZ CRM',
  description: 'Manage notes and tags for your contacts.',
};

export default function NotesPage() {
  return (
    <div className="container mx-auto py-6">
      <NotesAndTags />
    </div>
  );
}
