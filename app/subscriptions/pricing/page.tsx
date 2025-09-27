import { Metadata } from 'next';
import { PricingDisplay } from '@/components/features/subscriptions/PricingDisplay';

export const metadata: Metadata = {
  title: 'Pricing Plans | EventProsNZ',
  description:
    'View detailed pricing information for all subscription tiers. Compare monthly, yearly, and 2-year plans.',
  keywords: ['pricing', 'plans', 'subscription', 'billing', 'event planning'],
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PricingDisplay />
    </div>
  );
}
