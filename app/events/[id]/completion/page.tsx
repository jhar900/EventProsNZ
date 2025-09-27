import { EventManagement } from '@/components/features/events/management/EventManagement';

interface EventCompletionPageProps {
  params: {
    id: string;
  };
}

export default function EventCompletionPage({
  params,
}: EventCompletionPageProps) {
  return <EventManagement eventId={params.id} initialTab="completion" />;
}
