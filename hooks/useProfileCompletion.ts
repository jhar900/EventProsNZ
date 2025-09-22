'use client';

import { useState, useEffect } from 'react';

interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requirements: {
    personalInfo: boolean;
    contactInfo: boolean;
    businessInfo: boolean;
    profilePhoto: boolean;
  };
}

export function useProfileCompletion() {
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/completion');

      if (!response.ok) {
        throw new Error('Failed to fetch profile completion status');
      }

      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompletionStatus = async () => {
    try {
      setError(null);

      const response = await fetch('/api/profile/completion', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update profile completion status');
      }

      // Refresh the status after update
      await fetchCompletionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    fetchCompletionStatus();
  }, []);

  return {
    status,
    isLoading,
    error,
    refetch: fetchCompletionStatus,
    update: updateCompletionStatus,
  };
}
