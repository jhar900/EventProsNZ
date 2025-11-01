import { Metadata } from 'next';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import TermsOfServiceContent from '@/components/features/legal/TermsOfServiceContent';

export const metadata: Metadata = {
  title: 'Terms of Service | EventProsNZ',
  description:
    'Terms of Service for EventProsNZ platform - comprehensive legal terms and user agreement.',
  keywords:
    'terms of service, legal, user agreement, platform rules, EventProsNZ',
};

export default function TermsPage() {
  return (
    <HomepageLayout className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <TermsOfServiceContent />
      </div>
    </HomepageLayout>
  );
}
