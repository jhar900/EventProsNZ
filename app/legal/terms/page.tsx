import { Metadata } from 'next';
import { TermsOfServicePage } from '@/components/features/legal/TermsOfServicePage';

export const metadata: Metadata = {
  title: 'Terms of Service | EventProsNZ',
  description:
    'Terms of Service for EventProsNZ platform - comprehensive legal terms and user agreement.',
  keywords:
    'terms of service, legal, user agreement, platform rules, EventProsNZ',
};

export default function TermsPage() {
  return <TermsOfServicePage />;
}
