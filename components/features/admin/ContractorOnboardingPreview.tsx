'use client';

import { useState } from 'react';
import { PersonalInfoForm } from '@/components/features/onboarding/contractor/PersonalInfoForm';
import { BusinessInfoForm } from '@/components/features/onboarding/contractor/BusinessInfoForm';
import { ServicesPricingForm } from '@/components/features/onboarding/contractor/ServicesPricingForm';
import { PublicityForm } from '@/components/features/onboarding/contractor/PublicityForm';
import { ProgressIndicator } from '@/components/features/onboarding/contractor/ProgressIndicator';
import { OnboardingPreviewProvider } from '@/components/features/onboarding/PreviewContext';
import { MapboxProvider } from '@/lib/maps/mapbox-context';
import { CheckCircle, SkipForward } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Basic contact details',
  },
  {
    id: 2,
    title: 'Business Information',
    description: 'Company and service details',
  },
  {
    id: 3,
    title: 'Services & Pricing',
    description: 'What you offer and pricing',
  },
  { id: 4, title: 'Publicity', description: 'Profile and marketing consent' },
];

export function ContractorOnboardingPreview() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const markCompleted = (step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleProceedAnyway = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleComplete = (step: number) => {
    markCompleted(step);
  };

  const handleFinalSubmit = () => {
    setIsComplete(true);
  };

  const buildStatus = () => ({
    step1_completed: completedSteps.has(1),
    step2_completed: completedSteps.has(2),
    step3_completed: completedSteps.has(3),
    step4_completed: completedSteps.has(4),
  });

  if (isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Onboarding Preview Complete
          </h2>
          <p className="text-gray-600 mb-6">
            This is the end of the contractor onboarding flow. In production,
            the contractor&apos;s profile would be submitted for approval.
          </p>
          <button
            onClick={() => {
              setCurrentStep(1);
              setCompletedSteps(new Set());
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
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoForm
            onComplete={() => handleComplete(1)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BusinessInfoForm
            onComplete={() => handleComplete(2)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <ServicesPricingForm
            onComplete={() => handleComplete(3)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <PublicityForm
            onComplete={() => handleComplete(4)}
            onPrevious={handlePrevious}
            onSubmit={handleFinalSubmit}
            isSubmitting={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MapboxProvider>
      <OnboardingPreviewProvider>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contractor Onboarding
            </h1>
            <p className="text-gray-600">
              Complete your details to get listed on Event Pros NZ and start
              connecting with event managers!
            </p>
          </div>

          <ProgressIndicator
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps.size}
            status={buildStatus()}
          />

          <div className="mt-8">{renderStep()}</div>

          {/* Preview navigation bar */}
          <div className="mt-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
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
              onClick={handleProceedAnyway}
              className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <SkipForward className="h-4 w-4" />
              {currentStep < STEPS.length ? 'Skip to next step' : 'Skip to end'}
            </button>
          </div>
        </div>
      </OnboardingPreviewProvider>
    </MapboxProvider>
  );
}
