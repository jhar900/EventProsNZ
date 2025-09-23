import { Metadata } from 'next';
import { EventTemplates } from '@/components/features/events/EventTemplates';

export const metadata: Metadata = {
  title: 'Event Templates | EventProsNZ',
  description:
    'Browse our collection of pre-built event templates to get started quickly. Templates for weddings, corporate events, parties, and more.',
  keywords: [
    'event templates',
    'event planning',
    'wedding templates',
    'corporate event templates',
    'party templates',
  ],
};

export default function EventTemplatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold">Event Templates</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started quickly with our professionally designed event
            templates. Each template includes service requirements and budget
            recommendations.
          </p>
        </div>

        <EventTemplates />
      </div>
    </div>
  );
}
