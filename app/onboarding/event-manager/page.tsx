import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';
import { AuthGuard } from '@/components/features/auth/AuthGuard';
import { RoleGuard } from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EventManagerOnboardingPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['event_manager']}>
        <DashboardLayout disableNavigation={true}>
          <div className="min-h-screen bg-gray-50 py-8">
            <OnboardingWizard />
          </div>
        </DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
