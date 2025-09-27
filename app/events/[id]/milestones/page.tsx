import { EventManagement } from '@/components/features/events/management/EventManagement';

interface EventMilestonesPageProps {
  params: {
    id: string;
  };
}

export default function EventMilestonesPage({
  params,
}: EventMilestonesPageProps) {
  return <EventManagement eventId={params.id} initialTab="milestones" />;
}
