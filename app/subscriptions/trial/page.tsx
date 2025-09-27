import { Metadata } from 'next';
import { TrialManagement } from '@/components/features/subscriptions/TrialManagement';

export const metadata: Metadata = {
  title: 'Free Trial | EventProsNZ',
  description:
    'Start your free 14-day trial and explore premium features for your event planning business.',
  keywords: ['trial', 'free', 'premium', 'features', 'event planning'],
};

export default function TrialPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TrialManagement />
    </div>
  );
}
