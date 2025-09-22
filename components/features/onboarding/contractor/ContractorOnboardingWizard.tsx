'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersonalInfoForm } from './PersonalInfoForm';
import { BusinessInfoForm } from './BusinessInfoForm';
import { ServicesPricingForm } from './ServicesPricingForm';
import { PortfolioUploadForm } from './PortfolioUploadForm';
import { ProgressIndicator } from './ProgressIndicator';
import { ProfileCompletionTracker } from './ProfileCompletionTracker';
import { useContractorOnboarding } from '@/hooks/useContractorOnboarding';
import { Button } from '@/components/ui/button';

interface ContractorOnboardingWizardProps {
  initialStep?: number;
}

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
  { id: 4, title: 'Portfolio', description: 'Showcase your work' },
];

export function ContractorOnboardingWizard({
  initialStep = 1,
}: ContractorOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { progress, status, loadStatus, submitForApproval } =
    useContractorOnboarding();

  // Load onboarding status on mount
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleStepComplete = (step: number) => {
    // The hook will handle updating the status
    loadStatus();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await submitForApproval();
      if (success) {
        router.push('/onboarding/contractor/submitted');
      } else {
        console.error('Submission failed');
        // Handle error - show toast or error message
      }
    } catch (error) {
      console.error('Submission error:', error);
      // Handle error - show toast or error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (step: number) => {
    return progress.completedSteps >= step;
  };

  const canSubmit = progress.canSubmit;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoForm
            onComplete={() => handleStepComplete(1)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BusinessInfoForm
            onComplete={() => handleStepComplete(2)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <ServicesPricingForm
            onComplete={() => handleStepComplete(3)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <PortfolioUploadForm
            onComplete={() => handleStepComplete(4)}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contractor Onboarding
        </h1>
        <p className="text-gray-600">
          Complete your profile to start connecting with event managers
        </p>
      </div>

      <ProgressIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={progress.completedSteps}
      />

      <div className="mt-6">
        <ProfileCompletionTracker />
      </div>

      <div className="mt-8">{renderStep()}</div>
    </div>
  );
}
