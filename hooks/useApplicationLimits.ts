import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ApplicationLimits {
  tier: string;
  tier_name: string;
  monthly_limit: number;
  used: number;
  remaining: number;
  reset_date: string;
  is_unlimited: boolean;
}

interface ApplicationRestrictions {
  service_category_change_allowed: boolean;
  service_category_changed_at?: string;
  next_change_allowed_at?: string;
}

interface UseApplicationLimitsResult {
  limits: ApplicationLimits | null;
  restrictions: ApplicationRestrictions | null;
  currentServiceCategory: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canApply: (jobServiceCategory: string) => boolean;
  getRemainingApplications: () => number;
  canChangeServiceCategory: () => boolean;
}

export function useApplicationLimits(): UseApplicationLimitsResult {
  const { user } = useAuth();
  const [limits, setLimits] = useState<ApplicationLimits | null>(null);
  const [restrictions, setRestrictions] =
    useState<ApplicationRestrictions | null>(null);
  const [currentServiceCategory, setCurrentServiceCategory] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLimits = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/contractors/application-limits');

      if (!response.ok) {
        throw new Error('Failed to load application limits');
      }

      const data = await response.json();

      if (data.success) {
        setLimits(data.limits);
        setRestrictions(data.restrictions);
        setCurrentServiceCategory(data.current_service_category);
      } else {
        throw new Error(data.error || 'Failed to load application limits');
      }
    } catch (error) {
      console.error('Error loading application limits:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load application limits'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLimits();
  }, [user]);

  const canApply = (jobServiceCategory: string): boolean => {
    if (!limits || !currentServiceCategory) return false;

    // Check if service category matches
    if (currentServiceCategory !== jobServiceCategory) {
      return false;
    }

    // Check if user has remaining applications
    if (!limits.is_unlimited && limits.remaining <= 0) {
      return false;
    }

    return true;
  };

  const getRemainingApplications = (): number => {
    if (!limits) return 0;
    return limits.is_unlimited ? -1 : limits.remaining;
  };

  const canChangeServiceCategory = (): boolean => {
    if (!restrictions) return false;
    return restrictions.service_category_change_allowed;
  };

  return {
    limits,
    restrictions,
    currentServiceCategory,
    isLoading,
    error,
    refetch: loadLimits,
    canApply,
    getRemainingApplications,
    canChangeServiceCategory,
  };
}
