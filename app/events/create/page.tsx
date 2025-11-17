import { Metadata } from 'next';
import { EventCreationWizard } from '@/components/features/events/EventCreationWizard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'Create Event | EventProsNZ',
  description:
    'Create your perfect event with our guided event creation wizard. Plan your event step by step with intelligent recommendations.',
  keywords: [
    'event creation',
    'event planning',
    'event management',
    'New Zealand events',
  ],
};

export default function CreateEventPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <EventCreationWizard />
      </div>
    </DashboardLayout>
  );
}
