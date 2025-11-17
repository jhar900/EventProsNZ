'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStatus {
  step1_completed: boolean;
  step2_completed: boolean;
  step3_completed: boolean;
  step4_completed: boolean;
  is_submitted: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  submission_date?: string;
  approval_date?: string;
  admin_notes?: string;
}

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  completionPercentage: number;
  canProceed: boolean;
  canSubmit: boolean;
}

export function useContractorOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    // Don't fetch if auth is still loading or user is not available
    if (authLoading || !user?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/onboarding/contractor/status', {
        credentials: 'include', // Include cookies in the request
        headers: {
          'x-user-id': user.id, // Send user ID in header - same as other steps
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('useContractorOnboarding - Status loaded:', data);
        setStatus(data);
        setError(null);
      } else if (response.status === 401) {
        // If unauthorized, set default values (user might not be logged in yet)
        setStatus({
          step1_completed: false,
          step2_completed: false,
          step3_completed: false,
          step4_completed: false,
          is_submitted: false,
          approval_status: 'pending',
        });
        setError(null);
      } else {
        setError('Failed to load onboarding status');
      }
    } catch (err) {
      setError('An error occurred while loading status');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user?.id]); // Depend on authLoading and user.id

  const updateStep = async (step: number) => {
    try {
      const response = await fetch(`/api/onboarding/contractor/step${step}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
      });

      if (response.ok) {
        await loadStatus(); // Reload status after update
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update step');
        return false;
      }
    } catch (err) {
      setError('An error occurred while updating step');
      return false;
    }
  };

  const submitForApproval = async () => {
    // Check if user is available before submitting
    if (!user?.id) {
      setError('You must be logged in to submit');
      return false;
    }

    try {
      const response = await fetch('/api/onboarding/contractor/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Send user ID in header - same as other steps
        },
        credentials: 'include', // Include cookies in the request
      });

      if (response.ok) {
        await loadStatus(); // Reload status after submission
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit for approval');
        return false;
      }
    } catch (err) {
      setError('An error occurred while submitting');
      return false;
    }
  };

  const getProgress = (): OnboardingProgress => {
    if (!status) {
      return {
        currentStep: 1,
        totalSteps: 4,
        completedSteps: 0,
        completionPercentage: 0,
        canProceed: false,
        canSubmit: false,
      };
    }

    const completedSteps = [
      status.step1_completed,
      status.step2_completed,
      status.step3_completed,
      status.step4_completed,
    ].filter(Boolean).length;

    console.log('useContractorOnboarding - Calculating progress:', {
      step1: status.step1_completed,
      step2: status.step2_completed,
      step3: status.step3_completed,
      step4: status.step4_completed,
      completedSteps,
    });

    const currentStep = completedSteps === 4 ? 4 : completedSteps + 1;
    const completionPercentage = (completedSteps / 4) * 100;
    const canProceed = completedSteps > 0;
    const canSubmit = completedSteps === 4 && !status.is_submitted;

    return {
      currentStep,
      totalSteps: 4,
      completedSteps,
      completionPercentage,
      canProceed,
      canSubmit,
    };
  };

  const getStepStatus = (step: number): 'completed' | 'current' | 'pending' => {
    if (!status) return 'pending';

    switch (step) {
      case 1:
        return status.step1_completed ? 'completed' : 'current';
      case 2:
        if (status.step2_completed) return 'completed';
        return status.step1_completed ? 'current' : 'pending';
      case 3:
        if (status.step3_completed) return 'completed';
        return status.step2_completed ? 'current' : 'pending';
      case 4:
        if (status.step4_completed) return 'completed';
        return status.step3_completed ? 'current' : 'pending';
      default:
        return 'pending';
    }
  };

  useEffect(() => {
    // Only load status when auth is ready
    if (!authLoading) {
      loadStatus();
    }
  }, [authLoading, loadStatus]);

  return {
    status,
    loading,
    error,
    progress: getProgress(),
    getStepStatus,
    loadStatus,
    updateStep,
    submitForApproval,
  };
}
