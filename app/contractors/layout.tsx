import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contractor Directory | EventPros NZ',
  description:
    'Find verified contractors for your next event. Browse our comprehensive directory of professional event service providers.',
  keywords:
    'contractors, event services, catering, photography, venue, planning, New Zealand',
  openGraph: {
    title: 'Contractor Directory | EventPros NZ',
    description:
      'Find verified contractors for your next event. Browse our comprehensive directory of professional event service providers.',
    type: 'website',
  },
};

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
