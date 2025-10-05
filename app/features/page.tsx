import { Metadata } from 'next';
import { PremiumFeatureAccess } from '@/components/features/premium/PremiumFeatureAccess';

export const metadata: Metadata = {
  title: 'Premium Features | EventPros NZ',
  description:
    'Access premium features to grow your business and stand out from the competition.',
};

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PremiumFeatureAccess />
    </div>
  );
}
