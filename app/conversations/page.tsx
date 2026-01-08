import { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventManagerConversationsList from '@/components/features/conversations/EventManagerConversationsList';

export const metadata: Metadata = {
  title: 'Conversations | EventProsNZ',
  description: 'View and manage your conversations with contractors',
};

export default function ConversationsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pt-16 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <EventManagerConversationsList />
        </div>
      </div>
    </DashboardLayout>
  );
}
