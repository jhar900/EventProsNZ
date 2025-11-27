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
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    try {
      const cached = localStorage.getItem('profile_completion_status');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setStatus({
            isComplete: parsed.isComplete,
            completionPercentage: parsed.completionPercentage || 0,
            missingFields: parsed.missingFields || [],
            requirements: parsed.requirements || {
              personalInfo: false,
              contactInfo: false,
              businessInfo: false,
              profilePhoto: false,
            },
          });
          setIsLoading(false);
          // Still fetch fresh data in background, but don't block
          fetch('/api/profile/completion', {
            headers: {
              'x-user-id': user.id,
            },
            credentials: 'include',
          })
            .then(res => {
              if (res.ok) {
                return res.json();
              }
            })
            .then(data => {
              if (data?.status) {
                setStatus(data.status);
                // Update cache
                localStorage.setItem(
                  'profile_completion_status',
                  JSON.stringify({
                    isComplete: data.status.isComplete,
                    completionPercentage: data.status.completionPercentage,
                    missingFields: data.status.missingFields,
                    requirements: data.status.requirements,
                    timestamp: Date.now(),
                  })
                );
              }
            })
            .catch(() => {
              // Ignore background fetch errors
            });
          return;
        }
      }
    } catch (e) {
      // Ignore cache errors, continue with fetch
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/completion', {
        headers: {
          'x-user-id': user.id, // Send user ID in header
        },
        credentials: 'include', // Include cookies
      });

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

      // Cache the result
      try {
        localStorage.setItem(
          'profile_completion_status',
          JSON.stringify({
            isComplete: data.status.isComplete,
            completionPercentage: data.status.completionPercentage,
            missingFields: data.status.missingFields,
            requirements: data.status.requirements,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Ignore cache errors
      }
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
