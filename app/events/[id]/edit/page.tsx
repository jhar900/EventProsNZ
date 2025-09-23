import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventEditForm } from '@/components/features/events/EventEditForm';

interface EventEditPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EventEditPageProps): Promise<Metadata> {
  return {
    title: `Edit Event | EventProsNZ`,
    description: 'Edit your event details, service requirements, and budget.',
  };
}

export default function EventEditPage({ params }: EventEditPageProps) {
  const eventId = params.id;

  if (!eventId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground">
              Update your event details, service requirements, and budget.
            </p>
          </div>

          <EventEditForm eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
