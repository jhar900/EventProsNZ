import { Metadata } from 'next';
import { SubscriptionTiers } from '@/components/features/subscriptions/SubscriptionTiers';

export const metadata: Metadata = {
  title: 'Subscription Tiers | EventProsNZ',
  description:
    'Choose the perfect subscription tier for your event planning business. Essential, Showcase, and Spotlight plans available.',
  keywords: ['subscription', 'tiers', 'plans', 'pricing', 'event planning'],
};

export default function SubscriptionTiersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SubscriptionTiers />
    </div>
  );
}
