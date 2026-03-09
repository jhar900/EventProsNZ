'use client';

import { useState } from 'react';
import { PersonalInfoForm } from '@/components/features/onboarding/PersonalInfoForm';
import { RoleSelectionForm } from '@/components/features/onboarding/RoleSelectionForm';
import { BusinessDetailsForm } from '@/components/features/onboarding/BusinessDetailsForm';
import { ProfilePhotoUpload } from '@/components/features/onboarding/ProfilePhotoUpload';
import { OnboardingTutorial } from '@/components/features/onboarding/OnboardingTutorial';
import { ProgressIndicator } from '@/components/features/onboarding/ProgressIndicator';
import { MapboxProvider } from '@/lib/maps/mapbox-context';
import { CheckCircle, SkipForward } from 'lucide-react';

const ALL_STEPS = [
  { id: 1, title: 'Personal Information', component: 'personal' },
  { id: 2, title: 'Role Selection', component: 'role' },
  { id: 3, title: 'Business Details', component: 'business' },
  { id: 4, title: 'Profile Photo', component: 'photo' },
  { id: 5, title: 'Tutorial', component: 'tutorial' },
];

const PERSONAL_STEPS = ALL_STEPS.filter(s => s.id !== 3).map((s, i) => ({
  ...s,
  id: i + 1,
}));

const emptyPersonalInfo = {
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  linkedin_url: '',
  website_url: '',
};

const emptyBusinessInfo = {
  company_name: '',
  position: '',
  business_address: '',
  nzbn: '',
  description: '',
  service_areas: [] as string[],
  social_links: { website: '', facebook: '', instagram: '', linkedin: '' },
};

export function EventManagerOnboardingPreview() {
  const [currentStep, setCurrentStep] = useState(1);
  const [roleType, setRoleType] = useState<'personal' | 'business' | null>(
    null
  );
  const [isComplete, setIsComplete] = useState(false);

  // Steps shown depend on role chosen at step 2
  const steps = roleType === 'personal' ? PERSONAL_STEPS : ALL_STEPS;
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    handleNext();
  };

  // Map displayed step index to the actual step component id
  const actualStepId = steps[currentStep - 1]?.component;

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Onboarding Preview Complete
          </h2>
          <p className="text-gray-600 mb-6">
            This is the end of the event manager onboarding flow. In production
            the user would be redirected to their dashboard.
          </p>
          <button
            onClick={() => {
              setCurrentStep(1);
              setRoleType(null);
              setIsComplete(false);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Restart Preview
          </button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (actualStepId) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={emptyPersonalInfo}
            onComplete={() => handleNext()}
            isLoading={false}
          />
        );
      case 'role':
        return (
          <RoleSelectionForm
            data={roleType}
            onComplete={selected => {
              setRoleType(selected);
              handleNext();
            }}
            isLoading={false}
          />
        );
      case 'business':
        return (
          <BusinessDetailsForm
            data={emptyBusinessInfo}
            onComplete={() => handleNext()}
            isLoading={false}
          />
        );
      case 'photo':
        return (
          <ProfilePhotoUpload
            data={null}
            onComplete={() => handleNext()}
            isLoading={false}
          />
        );
      case 'tutorial':
        return (
          <OnboardingTutorial
            onComplete={() => handleNext()}
            isLoading={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MapboxProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to EventProsNZ
                </h1>
                <p className="text-gray-600">
                  Let&apos;s get your profile set up so you can start managing
                  events
                </p>
              </div>

              <ProgressIndicator
                currentStep={currentStep}
                totalSteps={totalSteps}
                steps={steps}
              />

              <div className="mt-8">{renderStep()}</div>
            </div>
          </div>

          {/* Admin preview bar */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Previous step
                </button>
              )}
            </div>
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <SkipForward className="h-4 w-4" />
              {currentStep < totalSteps ? 'Skip to next step' : 'Skip to end'}
            </button>
          </div>
        </div>
      </div>
    </MapboxProvider>
  );
}
