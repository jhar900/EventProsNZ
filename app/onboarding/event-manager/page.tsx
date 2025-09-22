import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';
import { AuthGuard } from '@/components/features/auth/AuthGuard';
import { RoleGuard } from '@/components/features/auth/RoleGuard';

export default function EventManagerOnboardingPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['event_manager']}>
        <OnboardingWizard />
      </RoleGuard>
    </AuthGuard>
  );
}
