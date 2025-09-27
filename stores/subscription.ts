import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface PromotionalCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  tier_applicable: ('essential' | 'showcase' | 'spotlight')[];
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

interface SubscriptionStore {
  // State
  currentSubscription: Subscription | null;
  availableTiers: SubscriptionTierInfo[];
  features: Record<string, any[]>;
  trial: TrialInfo | null;
  promotionalCodes: PromotionalCode[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentSubscription: (subscription: Subscription | null) => void;
  setAvailableTiers: (tiers: SubscriptionTierInfo[]) => void;
  setFeatures: (features: Record<string, any[]>) => void;
  setTrial: (trial: TrialInfo | null) => void;
  setPromotionalCodes: (codes: PromotionalCode[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async Actions
  loadSubscription: (userId: string) => Promise<void>;
  loadTiers: () => Promise<void>;
  loadFeatures: (tier?: string) => Promise<void>;
  loadTrial: (userId: string) => Promise<void>;
  loadPromotionalCodes: () => Promise<void>;

  // Subscription Management
  createSubscription: (
    tier: string,
    billingCycle: string,
    promotionalCode?: string
  ) => Promise<Subscription>;
  startTrial: (tier: string) => Promise<TrialInfo>;
  upgradeSubscription: (
    subscriptionId: string,
    newTier: string,
    effectiveDate?: Date
  ) => Promise<any>;
  downgradeSubscription: (
    subscriptionId: string,
    newTier: string,
    effectiveDate?: Date
  ) => Promise<any>;

  // Pricing and Validation
  calculatePricing: (
    tier: string,
    billingCycle: string,
    promotionalCode?: string
  ) => Promise<any>;
  validatePromotionalCode: (
    code: string,
    tier: string
  ) => Promise<{ valid: boolean; discount: any }>;
  validateFeatureAccess: (feature: string) => boolean;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentSubscription: null,
      availableTiers: [],
      features: {},
      trial: null,
      promotionalCodes: [],
      isLoading: false,
      error: null,

      // State Setters
      setCurrentSubscription: subscription =>
        set({ currentSubscription: subscription }),
      setAvailableTiers: tiers => set({ availableTiers: tiers }),
      setFeatures: features => set({ features }),
      setTrial: trial => set({ trial }),
      setPromotionalCodes: codes => set({ promotionalCodes: codes }),
      setLoading: loading => set({ isLoading: loading }),
      setError: error => set({ error }),

      // Async Actions
      loadSubscription: async userId => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/subscriptions');
          if (!response.ok) {
            throw new Error('Failed to load subscription');
          }

          const data = await response.json();
          set({ currentSubscription: data.subscriptions[0] || null });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load subscription',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadTiers: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/subscriptions/tiers');
          if (!response.ok) {
            throw new Error('Failed to load tiers');
          }

          const data = await response.json();
          set({ availableTiers: data.tiers || [] });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load tiers',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadFeatures: async tier => {
        try {
          set({ isLoading: true, error: null });

          const url = tier
            ? `/api/subscriptions/features?tier=${tier}`
            : '/api/subscriptions/features';

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to load features');
          }

          const data = await response.json();
          set({ features: data.features || {} });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load features',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadTrial: async userId => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/subscriptions/trial/status');
          if (!response.ok) {
            throw new Error('Failed to load trial');
          }

          const data = await response.json();
          set({ trial: data.trial });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load trial',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadPromotionalCodes: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/subscriptions/promotional');
          if (!response.ok) {
            throw new Error('Failed to load promotional codes');
          }

          const data = await response.json();
          set({ promotionalCodes: data.codes || [] });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load promotional codes',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Subscription Management
      createSubscription: async (tier, billingCycle, promotionalCode) => {
        try {
          set({ isLoading: true, error: null });

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
          set({ currentSubscription: data.subscription });
          return data.subscription;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create subscription',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      startTrial: async tier => {
        try {
          set({ isLoading: true, error: null });

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
          set({ trial: data.trial });
          return data.trial;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to start trial',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      upgradeSubscription: async (subscriptionId, newTier, effectiveDate) => {
        try {
          set({ isLoading: true, error: null });

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
            throw new Error(
              errorData.error || 'Failed to upgrade subscription'
            );
          }

          const data = await response.json();
          set({ currentSubscription: data.subscription });
          return data;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to upgrade subscription',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      downgradeSubscription: async (subscriptionId, newTier, effectiveDate) => {
        try {
          set({ isLoading: true, error: null });

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
            throw new Error(
              errorData.error || 'Failed to downgrade subscription'
            );
          }

          const data = await response.json();
          set({ currentSubscription: data.subscription });
          return data;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to downgrade subscription',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Pricing and Validation
      calculatePricing: async (tier, billingCycle, promotionalCode) => {
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

          return await response.json();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to calculate pricing',
          });
          throw error;
        }
      },

      validatePromotionalCode: async (code, tier) => {
        try {
          const response = await fetch(
            '/api/subscriptions/promotional/validate',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code, tier }),
            }
          );

          if (!response.ok) {
            return { valid: false, discount: null };
          }

          return await response.json();
        } catch (error) {
          return { valid: false, discount: null };
        }
      },

      validateFeatureAccess: feature => {
        const { currentSubscription } = get();
        if (!currentSubscription) return false;

        // This would typically check against the subscription features
        // For now, return true for active subscriptions
        return (
          currentSubscription.status === 'active' ||
          currentSubscription.status === 'trial'
        );
      },

      // Utility
      clearError: () => set({ error: null }),
      reset: () =>
        set({
          currentSubscription: null,
          availableTiers: [],
          features: {},
          trial: null,
          promotionalCodes: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'subscription-store',
      partialize: state => ({
        currentSubscription: state.currentSubscription,
        trial: state.trial,
      }),
    }
  )
);
