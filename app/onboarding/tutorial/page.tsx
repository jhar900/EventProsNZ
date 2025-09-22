'use client';

import { useRouter } from 'next/navigation';
import { OnboardingTutorial } from '@/components/features/onboarding/OnboardingTutorial';
import { AuthGuard } from '@/components/features/auth/AuthGuard';

export default function OnboardingTutorialPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <OnboardingTutorial
                onComplete={handleComplete}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
