'use client';

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  user_id: string;
  tier: 'essential' | 'showcase' | 'spotlight';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | '2year';
  price: number;
  start_date: string;
  end_date?: string;
  trial_end_date?: string;
  promotional_code?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
}

interface TrialInfo {
  subscription_id: string;
  tier: 'essential' | 'showcase' | 'spotlight';
  start_date: string;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
}

interface PricingInfo {
  tier: string;
  billing_cycle: string;
  base_price: number;
  discount_applied: number;
  final_price: number;
  savings: number;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTierInfo[]>([]);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current subscription
      const subscriptionResponse = await fetch('/api/subscriptions');
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.subscriptions[0] || null);
      }

      // Load subscription tiers
      const tiersResponse = await fetch('/api/subscriptions/tiers');
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers || []);
      }

      // Load trial status
      const trialResponse = await fetch('/api/subscriptions/trial/status');
      if (trialResponse.ok) {
        const trialData = await trialResponse.json();
        setTrial(trialData.trial);
      }
    } catch (err) {
      setError('Failed to load subscription data');
      } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (
    tier: string,
    billingCycle: string,
    promotionalCode?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          billing_cycle: billingCycle,
          promotional_code: promotionalCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      return data.subscription;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create subscription'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async (tier: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/trial/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trial');
      }

      const data = await response.json();
      setTrial(data.trial);
      return data.trial;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (
    subscriptionId: string,
    newTier: string,
    effectiveDate?: Date
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            new_tier: newTier,
            effective_date: effectiveDate?.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upgrade subscription'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downgradeSubscription = async (
    subscriptionId: string,
    newTier: string,
    effectiveDate?: Date
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/downgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            new_tier: newTier,
            effective_date: effectiveDate?.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to downgrade subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to downgrade subscription'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async (
    tier: string,
    billingCycle: string,
    promotionalCode?: string
  ): Promise<PricingInfo> => {
    try {
      const response = await fetch('/api/subscriptions/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          billing_cycle: billingCycle,
          promotional_code: promotionalCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate pricing');
      }

      const data = await response.json();
      return {
        tier,
        billing_cycle: billingCycle,
        base_price: data.total_price,
        discount_applied: data.discount_applied,
        final_price: data.final_price,
        savings: data.savings,
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to calculate pricing'
      );
      throw err;
    }
  };

  const validatePromotionalCode = async (code: string, tier: string) => {
    try {
      const response = await fetch('/api/subscriptions/promotional/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, tier }),
      });

      if (!response.ok) {
        return { valid: false, discount: null };
      }

      const data = await response.json();
      return data;
    } catch (err) {
      return { valid: false, discount: null };
    }
  };

  const hasFeatureAccess = async (featureName: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/subscriptions/features?feature=${featureName}`
      );
      if (!response.ok) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  };

  const refreshSubscription = () => {
    loadSubscriptionData();
  };

  return {
    subscription,
    tiers,
    trial,
    loading,
    error,
    createSubscription,
    startTrial,
    upgradeSubscription,
    downgradeSubscription,
    calculatePricing,
    validatePromotionalCode,
    hasFeatureAccess,
    refreshSubscription,
  };
}
