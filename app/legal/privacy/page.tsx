import { Metadata } from 'next';
import { PrivacyPolicyPage } from '@/components/features/legal/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | EventProsNZ',
  description:
    'Privacy Policy for EventProsNZ platform - data protection and privacy information.',
  keywords:
    'privacy policy, data protection, privacy, GDPR, personal data, EventProsNZ',
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
