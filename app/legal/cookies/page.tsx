import { Metadata } from 'next';
import { CookiePolicyPage } from '@/components/features/legal/CookiePolicyPage';

export const metadata: Metadata = {
  title: 'Cookie Policy | EventProsNZ',
  description:
    'Cookie Policy for EventProsNZ platform - cookie usage and management information.',
  keywords: 'cookie policy, cookies, tracking, analytics, consent, EventProsNZ',
};

export default function CookiePage() {
  return <CookiePolicyPage />;
}
