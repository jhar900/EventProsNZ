'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressIndicator } from './ProgressIndicator';
import { PersonalInfoForm } from './PersonalInfoForm';
import { RoleSelectionForm } from './RoleSelectionForm';
import { BusinessDetailsForm } from './BusinessDetailsForm';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { OnboardingTutorial } from './OnboardingTutorial';

interface OnboardingData {
  personalInfo: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
  };
  roleType: 'personal' | 'business' | null;
  businessInfo: {
    company_name: string;
    business_address: string;
    nzbn: string;
    description: string;
    service_areas: string[];
    social_links: {
      website: string;
      facebook: string;
      instagram: string;
      linkedin: string;
    };
  };
  profilePhoto: string | null;
}

const STEPS = [
  { id: 1, title: 'Personal Information', component: 'personal' },
  { id: 2, title: 'Role Selection', component: 'role' },
  { id: 3, title: 'Business Details', component: 'business' },
  { id: 4, title: 'Profile Photo', component: 'photo' },
  { id: 5, title: 'Tutorial', component: 'tutorial' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
    },
    roleType: null,
    businessInfo: {
      company_name: '',
      business_address: '',
      nzbn: '',
      description: '',
      service_areas: [],
      social_links: {
        website: '',
        facebook: '',
        instagram: '',
        linkedin: '',
      },
    },
    profilePhoto: null,
  });

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    setError(null);
    setIsLoading(true);

    try {
      const updatedData = { ...data, ...stepData };
      setData(updatedData);

      // Save step data to API
      if (currentStep === 1) {
        await savePersonalInfo(stepData.personalInfo!);
      } else if (currentStep === 2) {
        await saveRoleType(stepData.roleType!);
      } else if (currentStep === 3) {
        await saveBusinessInfo(stepData.businessInfo!);
      } else if (currentStep === 4) {
        await saveProfilePhoto(stepData.profilePhoto!);
      } else if (currentStep === 5) {
        await completeOnboarding();
        return; // Complete onboarding redirects
      }

      // Move to next step
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const savePersonalInfo = async (
    personalInfo: OnboardingData['personalInfo']
  ) => {
    const response = await fetch('/api/onboarding/event-manager/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personalInfo),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save personal information');
    }
  };

  const saveRoleType = async (roleType: 'personal' | 'business') => {
    const response = await fetch('/api/onboarding/event-manager/step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_type: roleType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save role type');
    }

    // Skip business details step if personal role
    if (roleType === 'personal') {
      setCurrentStep(4); // Skip to profile photo
    }
  };

  const saveBusinessInfo = async (
    businessInfo: OnboardingData['businessInfo']
  ) => {
    const response = await fetch('/api/onboarding/event-manager/step3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessInfo),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save business information');
    }
  };

  const saveProfilePhoto = async (profilePhoto: string | null) => {
    // Profile photo is already saved during upload, just continue
    return Promise.resolve();
  };

  const completeOnboarding = async () => {
    const response = await fetch('/api/onboarding/event-manager/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete onboarding');
    }

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoForm
            data={data.personalInfo}
            onComplete={personalInfo => handleStepComplete({ personalInfo })}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <RoleSelectionForm
            data={data.roleType}
            onComplete={roleType => handleStepComplete({ roleType })}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <BusinessDetailsForm
            data={data.businessInfo}
            onComplete={businessInfo => handleStepComplete({ businessInfo })}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <ProfilePhotoUpload
            data={data.profilePhoto}
            onComplete={profilePhoto => handleStepComplete({ profilePhoto })}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <OnboardingTutorial
            onComplete={() => handleStepComplete({})}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to EventProsNZ
              </h1>
              <p className="text-gray-600">
                Let's get your profile set up so you can start managing events
              </p>
            </div>

            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={STEPS.length}
              steps={STEPS}
            />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="mt-8">{renderCurrentStep()}</div>

            {currentStep > 1 && currentStep < 5 && (
              <div className="mt-8 flex justify-between">
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  ← Previous
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
