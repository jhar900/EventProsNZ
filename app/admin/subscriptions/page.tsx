import { Metadata } from 'next';
import { AdminSubscriptionManagement } from '@/components/features/subscriptions/AdminSubscriptionManagement';

export const metadata: Metadata = {
  title: 'Admin - Subscription Management | EventProsNZ',
  description:
    'Admin panel for managing subscriptions, pricing, and promotional codes.',
  keywords: [
    'admin',
    'subscription',
    'management',
    'pricing',
    'promotional codes',
  ],
};

export default function AdminSubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AdminSubscriptionManagement />
    </div>
  );
}
