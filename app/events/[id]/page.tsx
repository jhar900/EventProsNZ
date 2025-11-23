import DashboardLayout from '@/components/layout/DashboardLayout';
import { EventManagement } from '@/components/features/events/management/EventManagement';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  return (
    <DashboardLayout>
      <EventManagement eventId={params.id} initialTab="overview" />
    </DashboardLayout>
  );
}
