import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventVersionHistory } from '@/components/features/events/EventVersionHistory';

interface EventVersionsPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EventVersionsPageProps): Promise<Metadata> {
  return {
    title: `Event Version History | EventProsNZ`,
    description:
      'View the complete version history and changes for your event.',
  };
}

export default function EventVersionsPage({ params }: EventVersionsPageProps) {
  const eventId = params.id;

  if (!eventId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Event Version History</h1>
            <p className="text-muted-foreground">
              Track all changes made to your event over time.
            </p>
          </div>

          <EventVersionHistory eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
