import { ContractorOnboardingWizard } from '@/components/features/onboarding/contractor/ContractorOnboardingWizard';
import { MapboxProvider } from '@/lib/maps/mapbox-context';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ContractorOnboardingPage() {
  return (
    <MapboxProvider>
      <DashboardLayout disableNavigation={true}>
        <div className="min-h-screen bg-gray-50 py-8">
          <ContractorOnboardingWizard />
        </div>
      </DashboardLayout>
    </MapboxProvider>
  );
}
