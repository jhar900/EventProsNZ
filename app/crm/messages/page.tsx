import { Metadata } from 'next';
import { MessageTracking } from '@/components/features/crm/MessageTracking';

export const metadata: Metadata = {
  title: 'Message Tracking | EventProsNZ CRM',
  description: 'Track and manage your conversations with contacts.',
};

export default function MessagesPage() {
  return (
    <div className="container mx-auto py-6">
      <MessageTracking />
    </div>
  );
}
