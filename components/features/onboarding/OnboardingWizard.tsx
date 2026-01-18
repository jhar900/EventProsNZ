'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
    linkedin_url?: string;
    website_url?: string;
  };
  roleType: 'personal' | 'business' | null;
  businessInfo: {
    company_name: string;
    position: string;
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
  const { user } = useAuth();
  // Check if user came from invitation (check localStorage for flag)
  const [isTeamMember, setIsTeamMember] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check if there's a flag indicating they came from an invitation
      const flag = localStorage.getItem('from-team-invitation') === 'true';
      console.log(
        '[OnboardingWizard] Initial isTeamMember from localStorage:',
        flag
      );
      return flag;
    }
    return false;
  });
  const [isCheckingTeamMember, setIsCheckingTeamMember] = useState(true);

  // Initialize currentStep from localStorage if available, otherwise default to 1
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('event-manager-onboarding-step');
      return savedStep ? parseInt(savedStep, 10) : 1;
    }
    return 1;
  });

  // Check if user is a team member
  useEffect(() => {
    const checkTeamMemberStatus = async () => {
      // If no user yet, wait a bit and check again (user might be loading)
      if (!user?.id) {
        const hasFlag =
          typeof window !== 'undefined' &&
          localStorage.getItem('from-team-invitation') === 'true';
        if (hasFlag) {
          // If localStorage flag exists, trust it until user loads
          console.log(
            '[OnboardingWizard] No user yet but localStorage flag exists, keeping team member status'
          );
          setIsTeamMember(true);
        }
        setIsCheckingTeamMember(false);
        return;
      }

      try {
        const response = await fetch('/api/team-members/check', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const isMember = data.isTeamMember || false;
          const hasLocalStorageFlag =
            typeof window !== 'undefined' &&
            localStorage.getItem('from-team-invitation') === 'true';

          console.log('[OnboardingWizard] Team member check result:', {
            isMember,
            hasLocalStorageFlag,
            data,
          });

          // If API confirms they're a team member, or if localStorage flag exists, set as team member
          // Only clear the flag if API explicitly says they're NOT a team member
          const shouldBeTeamMember = isMember || hasLocalStorageFlag;
          setIsTeamMember(shouldBeTeamMember);

          // Store flag in localStorage for future reference
          if (typeof window !== 'undefined') {
            if (shouldBeTeamMember) {
              localStorage.setItem('from-team-invitation', 'true');
              console.log(
                '[OnboardingWizard] Set from-team-invitation flag to true'
              );
            } else if (isMember === false && !hasLocalStorageFlag) {
              // Only remove flag if API explicitly says false AND localStorage doesn't have it
              localStorage.removeItem('from-team-invitation');
              console.log(
                '[OnboardingWizard] Removed from-team-invitation flag'
              );
            }
          }

          // If team member and current step is 2 or 3, redirect to step 4
          if (shouldBeTeamMember && (currentStep === 2 || currentStep === 3)) {
            console.log(
              '[OnboardingWizard] Team member on step 2 or 3, redirecting to step 4'
            );
            setCurrentStep(4);
            if (typeof window !== 'undefined') {
              localStorage.setItem('event-manager-onboarding-step', '4');
            }
          }
        } else {
          const errorText = await response.text();
          console.error(
            '[OnboardingWizard] Team member check failed:',
            response.status,
            errorText
          );
          // If API fails but localStorage flag exists, keep team member status
          if (typeof window !== 'undefined') {
            const hasFlag =
              localStorage.getItem('from-team-invitation') === 'true';
            if (hasFlag && !isTeamMember) {
              console.log(
                '[OnboardingWizard] API check failed but localStorage flag exists, keeping team member status'
              );
              setIsTeamMember(true);
            }
          }
        }
      } catch (err) {
        console.error('Error checking team member status:', err);
        // If API check fails but localStorage flag exists, keep it
        if (typeof window !== 'undefined') {
          const hasFlag =
            localStorage.getItem('from-team-invitation') === 'true';
          if (hasFlag && !isTeamMember) {
            // Keep the flag and maintain team member status
            console.log(
              '[OnboardingWizard] API check failed but localStorage flag exists, keeping team member status'
            );
            setIsTeamMember(true);
          }
        }
      } finally {
        setIsCheckingTeamMember(false);
      }
    };

    checkTeamMemberStatus();
  }, [user?.id, currentStep]);

  // Filter steps based on team member status and renumber them
  const availableSteps = isTeamMember
    ? STEPS.filter(step => step.id !== 2 && step.id !== 3).map(
        (step, index) => ({ ...step, id: index + 1 })
      ) // Renumber: 1, 2, 3 (was 1, 4, 5)
    : STEPS;

  console.log('[OnboardingWizard] Steps configuration:', {
    isTeamMember,
    availableStepsCount: availableSteps.length,
    availableSteps: availableSteps.map(s => ({ id: s.id, title: s.title })),
    allSteps: STEPS.map(s => ({ id: s.id, title: s.title })),
  });

  // Map displayed step number to actual step number
  const getActualStepNumber = (displayedStep: number): number => {
    if (!isTeamMember) return displayedStep;
    // For team members: 1 -> 1, 2 -> 4, 3 -> 5
    if (displayedStep === 1) return 1;
    if (displayedStep === 2) return 4;
    if (displayedStep === 3) return 5;
    return displayedStep;
  };

  // Map actual step number to displayed step number
  const getDisplayedStepNumber = (actualStep: number): number => {
    if (!isTeamMember) return actualStep;
    // For team members: 1 -> 1, 4 -> 2, 5 -> 3
    if (actualStep === 1) return 1;
    if (actualStep === 4) return 2;
    if (actualStep === 5) return 3;
    return actualStep;
  };

  // Get the displayed step number for progress indicator
  const displayedStep = getDisplayedStepNumber(currentStep);

  // Persist currentStep to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'event-manager-onboarding-step',
        currentStep.toString()
      );
      console.log('OnboardingWizard: currentStep changed to:', currentStep);
    }
  }, [currentStep]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      linkedin_url: '',
      website_url: '',
    },
    roleType: null,
    businessInfo: {
      company_name: '',
      position: '',
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

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) {
        setIsLoadingData(false);
        return;
      }

      console.log(
        'OnboardingWizard: Loading existing data, currentStep is:',
        currentStep
      );
      // Don't modify currentStep here - it's already initialized from localStorage
      // This useEffect should only load data, not change the step
      try {
        // Load personal info
        const profileResponse = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        let profileData: any = null;
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          profileData = profileResult.profile || profileResult;

          if (profileData) {
            setData(prev => ({
              ...prev,
              personalInfo: {
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                phone: profileData.phone || '',
                address: profileData.address || '',
                linkedin_url: profileData.linkedin_url || '',
                website_url: profileData.website_url || '',
              },
              roleType: (profileData.preferences as any)?.role_type || null,
              profilePhoto: profileData.avatar_url || null,
            }));
          }
        }

        // Load business info (only if role type is business)
        const businessResponse = await fetch('/api/user/business-profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (businessResponse.ok) {
          const businessResult = await businessResponse.json();
          const businessProfile =
            businessResult.businessProfile || businessResult.business_profile;

          if (businessProfile) {
            // Get position from profile preferences
            const position = (profileData?.preferences as any)?.position || '';

            setData(prev => ({
              ...prev,
              businessInfo: {
                company_name: businessProfile.company_name || '',
                position: position,
                business_address:
                  businessProfile.business_address ||
                  businessProfile.location ||
                  '',
                nzbn: businessProfile.nzbn || '',
                description: businessProfile.description || '',
                service_areas: Array.isArray(businessProfile.service_areas)
                  ? businessProfile.service_areas
                  : [],
                social_links: {
                  website:
                    businessProfile.website ||
                    businessProfile.social_links?.website ||
                    '',
                  facebook:
                    businessProfile.facebook_url ||
                    businessProfile.social_links?.facebook ||
                    '',
                  instagram:
                    businessProfile.instagram_url ||
                    businessProfile.social_links?.instagram ||
                    '',
                  linkedin:
                    businessProfile.linkedin_url ||
                    businessProfile.social_links?.linkedin ||
                    '',
                },
              },
            }));
          }
        }
      } catch (err) {
        console.error('Error loading existing data:', err);
        // Don't show error to user, just continue with empty form
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [user?.id]);

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    setError(null);
    setIsLoading(true);

    try {
      const updatedData = { ...data, ...stepData };
      setData(updatedData);

      // Save step data to API
      if (currentStep === 1) {
        await savePersonalInfo(stepData.personalInfo!);
        // If team member, set roleType to 'personal' and skip to step 4 (profile photo)
        if (isTeamMember) {
          // Set roleType to 'personal' for team members (they don't need business details)
          await saveRoleType('personal');
          setCurrentStep(4); // Skip role selection and business details
        } else {
          setCurrentStep(2);
        }
        setIsLoading(false);
        return;
      } else if (currentStep === 2) {
        await saveRoleType(stepData.roleType!);
        // Skip business details step if personal role
        if (stepData.roleType === 'personal') {
          setCurrentStep(4); // Skip to profile photo
          setIsLoading(false);
          return;
        }
        // Move to step 3 (business details) for business role
        setCurrentStep(3);
        setIsLoading(false);
        return;
      } else if (currentStep === 3) {
        console.log('Step 3: Starting save process...', stepData.businessInfo);
        console.log('Step 3: Current step before save:', currentStep);
        try {
          await saveBusinessInfo(stepData.businessInfo!);
          console.log('Step 3: Business info saved successfully');
          console.log('Step 3: Setting step to 4...');
          // Explicitly move to step 4 (profile photo) after business info is saved
          // Use a function to ensure we're using the latest state
          setCurrentStep(prevStep => {
            console.log(
              'Step 3: setCurrentStep called, prevStep was:',
              prevStep
            );
            const newStep = 4;
            console.log('Step 3: Setting new step to:', newStep);
            // Also update localStorage immediately
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'event-manager-onboarding-step',
                newStep.toString()
              );
              console.log('Step 3: Saved step 4 to localStorage');
            }
            return newStep;
          });
          console.log('Step 3: Step set to 4, setting loading to false');
          setIsLoading(false);
          console.log('Step 3: Returning from handleStepComplete');
          return;
        } catch (saveError) {
          console.error('Step 3: Error saving business info:', saveError);
          throw saveError; // Re-throw to be caught by outer catch
        }
      } else if (currentStep === 4) {
        // Validate that profile photo is provided
        if (!stepData.profilePhoto || stepData.profilePhoto.trim() === '') {
          throw new Error('Profile photo is required');
        }
        await saveProfilePhoto(stepData.profilePhoto);
        // Move to step 5 (tutorial)
        setCurrentStep(5);
        setIsLoading(false);
        return;
      } else if (currentStep === 5) {
        await completeOnboarding();
        // Clear localStorage when onboarding is complete
        if (typeof window !== 'undefined') {
          localStorage.removeItem('event-manager-onboarding-step');
          localStorage.removeItem('from-team-invitation');
        }
        return; // Complete onboarding redirects
      }
    } catch (err) {
      console.error('Error in handleStepComplete:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const savePersonalInfo = async (
    personalInfo: OnboardingData['personalInfo']
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to submit this form');
    }

    const response = await fetch('/api/onboarding/event-manager/step1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      credentials: 'include',
      body: JSON.stringify(personalInfo),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save personal information');
    }
  };

  const saveRoleType = async (roleType: 'personal' | 'business') => {
    if (!user?.id) {
      throw new Error('You must be logged in to submit this form');
    }

    const response = await fetch('/api/onboarding/event-manager/step2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      credentials: 'include',
      body: JSON.stringify({ role_type: roleType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save role type');
    }
  };

  const saveBusinessInfo = async (
    businessInfo: OnboardingData['businessInfo']
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to submit this form');
    }

    console.log('saveBusinessInfo: Sending request with data:', businessInfo);
    const response = await fetch('/api/onboarding/event-manager/step3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      credentials: 'include',
      body: JSON.stringify(businessInfo),
    });

    console.log('saveBusinessInfo: Response status:', response.status);
    if (!response.ok) {
      const error = await response.json();
      console.error('saveBusinessInfo: Error response:', error);
      throw new Error(error.error || 'Failed to save business information');
    }

    const result = await response.json();
    console.log('saveBusinessInfo: Success response:', result);
  };

  const saveProfilePhoto = async (profilePhoto: string | null) => {
    // Profile photo is already saved during upload, just continue
    return Promise.resolve();
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      throw new Error('You must be logged in to complete onboarding');
    }

    const response = await fetch('/api/onboarding/event-manager/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete onboarding');
    }

    // Clear the completion status cache to force a fresh check
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profile_completion_status');
      // Set a flag to indicate onboarding was just completed
      // This helps OnboardingGuard know to allow dashboard access
      localStorage.setItem('onboarding_just_completed', Date.now().toString());
      console.log(
        '[OnboardingWizard] Cleared completion status cache and set completion flag'
      );
    }

    // Wait a bit longer to ensure database update propagates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use replace instead of push to avoid history issues and prevent back button from going to onboarding
    router.replace('/dashboard');
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      let newStep = currentStep - 1;

      // If team member, skip steps 2 and 3 when going back
      if (isTeamMember) {
        if (newStep === 3) {
          newStep = 1; // Skip from step 3 to step 1
        } else if (newStep === 2) {
          newStep = 1; // Skip from step 2 to step 1
        }
      }

      setCurrentStep(newStep);
      // Update localStorage when going back
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'event-manager-onboarding-step',
          newStep.toString()
        );
        console.log('OnboardingWizard: Going back to step', newStep);
      }
    }
  };

  const renderCurrentStep = () => {
    // Prevent rendering steps 2 and 3 for team members
    if (isTeamMember && (currentStep === 2 || currentStep === 3)) {
      return null; // This shouldn't happen, but just in case
    }

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
            onPhotoChange={profilePhoto => {
              // Update local state when photo changes, but don't advance step
              setData(prev => ({ ...prev, profilePhoto }));
            }}
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
                Let&apos;s get your profile set up so you can start managing
                events
              </p>
            </div>

            <ProgressIndicator
              currentStep={displayedStep}
              totalSteps={availableSteps.length}
              steps={availableSteps}
            />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {isLoadingData || isCheckingTeamMember ? (
              <div className="mt-8 flex justify-center items-center py-12">
                <div className="text-gray-500">Loading your information...</div>
              </div>
            ) : (
              <div className="mt-8">{renderCurrentStep()}</div>
            )}

            {currentStep > 1 && currentStep <= 5 && (
              <div className="mt-8 flex justify-between">
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
