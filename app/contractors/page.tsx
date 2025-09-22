import { Metadata } from 'next';
import { ContractorDirectory } from '@/components/features/contractors/ContractorDirectory';

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

export default function ContractorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ContractorDirectory showFilters={true} showFeatured={true} />
      </div>
    </div>
  );
}
