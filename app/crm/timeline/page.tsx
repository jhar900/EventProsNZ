import { Metadata } from 'next';
import { ActivityTimeline } from '@/components/features/crm/ActivityTimeline';

export const metadata: Metadata = {
  title: 'Activity Timeline | EventProsNZ CRM',
  description: 'View activity timeline for your contacts.',
};

export default function TimelinePage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ActivityTimeline />
    </div>
  );
}
