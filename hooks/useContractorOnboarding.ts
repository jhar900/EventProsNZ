'use client';

import { useState, useEffect } from 'react';

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
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/onboarding/contractor/status');

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError(null);
      } else {
        setError('Failed to load onboarding status');
      }
    } catch (err) {
      setError('An error occurred while loading status');
      } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step: number) => {
    try {
      const response = await fetch(`/api/onboarding/contractor/step${step}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    try {
      const response = await fetch('/api/onboarding/contractor/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    loadStatus();
  }, []);

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
