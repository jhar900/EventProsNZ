import { EventManagement } from '@/components/features/events/management/EventManagement';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  return <EventManagement eventId={params.id} initialTab="overview" />;
}
