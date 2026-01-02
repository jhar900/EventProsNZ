'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersonalInfoForm } from './PersonalInfoForm';
import { BusinessInfoForm } from './BusinessInfoForm';
import { ServicesPricingForm } from './ServicesPricingForm';
import { PublicityForm } from './PublicityForm';
import { ProgressIndicator } from './ProgressIndicator';
import { SubmittedOnboardingView } from './SubmittedOnboardingView';
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
  { id: 4, title: 'Publicity', description: 'Profile and marketing consent' },
];

export function ContractorOnboardingWizard({
  initialStep = 1,
}: ContractorOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();
  const { progress, status, loadStatus, submitForApproval } =
    useContractorOnboarding();

  // Note: loadStatus is already called in the hook's useEffect on mount
  // We only call it manually when a step is completed

  // If onboarding is already submitted, redirect to dashboard
  // Users should have access to dashboard functions even if unverified
  // Use router.replace to avoid adding to history and prevent redirect loops
  useEffect(() => {
    if (status && status.is_submitted && !hasRedirected) {
      // Only redirect if we're actually on the onboarding page
      // This prevents redirect loops if the user navigates away
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/onboarding')) {
        setHasRedirected(true);
        // Small delay to prevent rapid redirects during status updates
        const timeoutId = setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [status, router, hasRedirected]);

  const handleStepComplete = async (step: number) => {
    // Reload status after step completion with a small delay to ensure API has updated
    setTimeout(() => {
      loadStatus();
    }, 500);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      // Refresh status when moving to next step to ensure progress is updated
      setTimeout(() => {
        loadStatus();
      }, 300);
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
        // Redirect to dashboard after successful submission
        router.push('/dashboard');
      } else {
        // Handle error - show toast or error message
      }
    } catch (error) {
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
          <PublicityForm
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
          Complete your details to get listed on Event Pros NZ and start
          connecting with event managers!
        </p>
      </div>

      <ProgressIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={progress.completedSteps}
        status={status}
      />

      <div className="mt-8">{renderStep()}</div>
    </div>
  );
}
