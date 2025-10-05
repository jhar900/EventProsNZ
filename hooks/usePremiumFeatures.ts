'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface FeatureAccess {
  id: string;
  user_id: string;
  feature_name: string;
  tier_required: string;
  is_accessible: boolean;
  access_granted_at: string;
  access_expires_at?: string;
}

interface TierFeature {
  id: string;
  tier: string;
  feature_name: string;
  feature_description: string;
  is_included: boolean;
  limit_value?: number;
}

interface UserSubscription {
  tier: string;
  status: string;
}

interface PremiumFeaturesState {
  featureAccess: FeatureAccess[];
  tierFeatures: TierFeature[];
  userSubscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;
}

export function usePremiumFeatures() {
  const { user } = useAuth();
  const [state, setState] = useState<PremiumFeaturesState>({
    featureAccess: [],
    tierFeatures: [],
    userSubscription: null,
    isLoading: true,
    error: null,
  });

  const loadFeatureAccess = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/features/access?user_id=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to load feature access');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        featureAccess: data.features || [],
        tierFeatures: data.tierFeatures || [],
        userSubscription: { tier: data.tier, status: 'active' },
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        isLoading: false,
      }));
    }
  };

  const checkFeatureAccess = async (featureName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(
        `/api/features/access?user_id=${user.id}&feature_name=${featureName}`
      );
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.accessible || false;
    } catch (err) {
      return false;
    }
  };

  const createFeatureAccess = async (
    featureName: string,
    tierRequired: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/features/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_name: featureName,
          tier_required: tierRequired,
        }),
      });

      if (!response.ok) {
        return false;
      }

      // Reload feature access
      await loadFeatureAccess();
      return true;
    } catch (err) {
      return false;
    }
  };

  const getTierFeatures = async (tier: string): Promise<TierFeature[]> => {
    try {
      const response = await fetch(`/api/features/tier?tier=${tier}`);
      if (!response.ok) {
        throw new Error('Failed to load tier features');
      }

      const data = await response.json();
      return data.features || [];
    } catch (err) {
      return [];
    }
  };

  const getSpotlightFeatures = async () => {
    if (!user) return [];

    try {
      const response = await fetch(
        `/api/features/spotlight?user_id=${user.id}`
      );
      if (!response.ok) {
        throw new Error('Failed to load spotlight features');
      }

      const data = await response.json();
      return data.spotlight_features || [];
    } catch (err) {
      return [];
    }
  };

  const createSpotlightFeature = async (
    featureType: string,
    featureData: any
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/features/spotlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_type: featureType,
          feature_data: featureData,
        }),
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  };

  const getCustomProfileURL = async () => {
    if (!user) return null;

    try {
      const response = await fetch(
        `/api/features/custom-url?user_id=${user.id}`
      );
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.custom_url;
    } catch (err) {
      return null;
    }
  };

  const createCustomProfileURL = async (
    customUrl: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/features/custom-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_url: customUrl,
        }),
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  };

  const getAdvancedAnalytics = async () => {
    if (!user) return null;

    try {
      const response = await fetch(
        `/api/features/analytics?user_id=${user.id}`
      );
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.analytics;
    } catch (err) {
      return null;
    }
  };

  const createSupportTicket = async (
    subject: string,
    description: string,
    priority: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/features/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          description,
          priority,
        }),
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  };

  const getEarlyAccessFeatures = async () => {
    if (!user) return [];

    try {
      const response = await fetch(
        `/api/features/early-access?user_id=${user.id}`
      );
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.early_access_features || [];
    } catch (err) {
      return [];
    }
  };

  const createEarlyAccessRequest = async (
    featureName: string,
    reason: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/features/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_name: featureName,
          reason,
        }),
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadFeatureAccess();
    }
  }, [user]);

  return {
    ...state,
    loadFeatureAccess,
    checkFeatureAccess,
    createFeatureAccess,
    getTierFeatures,
    getSpotlightFeatures,
    createSpotlightFeature,
    getCustomProfileURL,
    createCustomProfileURL,
    getAdvancedAnalytics,
    createSupportTicket,
    getEarlyAccessFeatures,
    createEarlyAccessRequest,
  };
}
