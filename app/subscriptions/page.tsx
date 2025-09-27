import { Metadata } from 'next';
import { SubscriptionManagement } from '@/components/features/subscriptions/SubscriptionManagement';

export const metadata: Metadata = {
  title: 'Subscription Management | EventProsNZ',
  description:
    'Manage your subscription and access premium features for your event planning business.',
  keywords: [
    'subscription',
    'billing',
    'premium',
    'features',
    'event planning',
  ],
};

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SubscriptionManagement />
    </div>
  );
}
