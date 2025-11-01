import { Metadata } from 'next';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import PrivacyPolicyContent from '@/components/features/legal/PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | EventProsNZ',
  description:
    'Privacy Policy for EventProsNZ platform - how we collect, use, and protect your personal information.',
  keywords:
    'privacy policy, data protection, personal information, GDPR, EventProsNZ',
};

export default function PrivacyPage() {
  return (
    <HomepageLayout className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <PrivacyPolicyContent />
      </div>
    </HomepageLayout>
  );
}
