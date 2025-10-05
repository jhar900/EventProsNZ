import { Metadata } from 'next';
import { SpotlightFeatures } from '@/components/features/premium/SpotlightFeatures';
import { CustomProfileURL } from '@/components/features/premium/CustomProfileURL';
import { ContractorSpotlight } from '@/components/features/premium/ContractorSpotlight';

export const metadata: Metadata = {
  title: 'Spotlight Features | EventPros NZ',
  description: 'Premium spotlight features to make your profile stand out.',
};

export default function SpotlightPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Spotlight Features</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Premium features to make your profile stand out and get maximum
          visibility.
        </p>
      </div>

      <div className="grid gap-8">
        <SpotlightFeatures />
        <CustomProfileURL />
        <ContractorSpotlight />
      </div>
    </div>
  );
}
