'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletionStatus = async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/completion');

      // Handle 401 (Unauthorized) gracefully - user just isn't logged in yet
      if (response.status === 401) {
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile completion status');
      }

      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      // Only set error for non-401 errors
      if (err instanceof Error && !err.message.includes('401')) {
        setError(err.message);
      }
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
    // Only fetch when auth is loaded and user exists
    if (!authLoading) {
      fetchCompletionStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchCompletionStatus,
    update: updateCompletionStatus,
  };
}
