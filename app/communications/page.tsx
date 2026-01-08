import { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventManagerMessagesList from '@/components/features/messages/EventManagerMessagesList';

export const metadata: Metadata = {
  title: 'Messages | EventProsNZ',
  description: 'View and manage your messages with contractors',
};

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pt-16 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <EventManagerMessagesList />
        </div>
      </div>
    </DashboardLayout>
  );
}
