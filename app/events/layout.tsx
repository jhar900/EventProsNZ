import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Management | EventPros NZ',
  description:
    'Manage your events throughout their lifecycle. Create, track, and organize your events with comprehensive management tools.',
  keywords:
    'event management, events, planning, tracking, milestones, New Zealand',
  openGraph: {
    title: 'Event Management | EventPros NZ',
    description:
      'Manage your events throughout their lifecycle. Create, track, and organize your events with comprehensive management tools.',
    type: 'website',
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
