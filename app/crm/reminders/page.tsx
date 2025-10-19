import { Metadata } from 'next';
import { FollowUpReminders } from '@/components/features/crm/FollowUpReminders';

export const metadata: Metadata = {
  title: 'Follow-up Reminders | EventProsNZ CRM',
  description: 'Manage your follow-up reminders and scheduling.',
};

export default function RemindersPage() {
  return (
    <div className="container mx-auto py-6">
      <FollowUpReminders />
    </div>
  );
}
