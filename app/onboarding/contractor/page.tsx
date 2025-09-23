import { ContractorOnboardingWizard } from '@/components/features/onboarding/contractor/ContractorOnboardingWizard';
import { MapboxProvider } from '@/lib/maps/mapbox-context';

export default function ContractorOnboardingPage() {
  return (
    <MapboxProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <ContractorOnboardingWizard />
      </div>
    </MapboxProvider>
  );
}
