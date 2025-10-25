import { Metadata } from 'next';
import { PricingPage } from '@/components/features/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Pricing & Subscription Plans | EventProsNZ',
  description:
    'Choose the perfect subscription plan for your event planning business. Essential (Free), Showcase ($29/month), or Spotlight ($69/month) with annual discounts.',
  keywords: [
    'pricing',
    'subscription',
    'plans',
    'essential',
    'showcase',
    'spotlight',
    'event planning',
    'contractor',
    'free trial',
  ],
};

export default function Pricing() {
  return <PricingPage />;
}
