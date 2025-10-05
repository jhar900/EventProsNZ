import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface SpotlightFeature {
  id: string;
  user_id: string;
  feature_type: string;
  feature_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomProfileURL {
  id: string;
  user_id: string;
  custom_url: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  profile_views: number;
  search_appearances: number;
  inquiries: number;
  conversion_rate: number;
  top_search_terms: any[];
  recent_activity: any[];
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EarlyAccessFeature {
  id: string;
  feature_name: string;
  feature_description: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
}

interface EarlyAccessRequest {
  id: string;
  user_id: string;
  feature_name: string;
  reason: string;
  status: string;
  created_at: string;
}

interface PremiumFeaturesStore {
  // State
  currentTier: string;
  accessibleFeatures: FeatureAccess[];
  tierFeatures: TierFeature[];
  spotlightFeatures: SpotlightFeature[];
  customProfileURL: CustomProfileURL | null;
  advancedAnalytics: AnalyticsData | null;
  supportTickets: SupportTicket[];
  earlyAccessFeatures: EarlyAccessFeature[];
  earlyAccessRequests: EarlyAccessRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentTier: (tier: string) => void;
  setAccessibleFeatures: (features: FeatureAccess[]) => void;
  setTierFeatures: (features: TierFeature[]) => void;
  setSpotlightFeatures: (features: SpotlightFeature[]) => void;
  setCustomProfileURL: (url: CustomProfileURL | null) => void;
  setAdvancedAnalytics: (analytics: AnalyticsData | null) => void;
  setSupportTickets: (tickets: SupportTicket[]) => void;
  setEarlyAccessFeatures: (features: EarlyAccessFeature[]) => void;
  setEarlyAccessRequests: (requests: EarlyAccessRequest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Feature Access Methods
  checkFeatureAccess: (featureName: string) => Promise<boolean>;
  loadTierFeatures: (tier: string) => Promise<void>;
  loadSpotlightFeatures: (userId: string) => Promise<void>;
  createCustomProfileURL: (customUrl: string) => Promise<void>;
  loadAdvancedAnalytics: (userId: string) => Promise<void>;
  loadPrioritySupport: (userId: string) => Promise<void>;
  loadEarlyAccessFeatures: (userId: string) => Promise<void>;
  validateFeatureAccess: (featureName: string) => boolean;

  // Reset
  reset: () => void;
}

export const usePremiumFeaturesStore = create<PremiumFeaturesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentTier: 'essential',
      accessibleFeatures: [],
      tierFeatures: [],
      spotlightFeatures: [],
      customProfileURL: null,
      advancedAnalytics: null,
      supportTickets: [],
      earlyAccessFeatures: [],
      earlyAccessRequests: [],
      isLoading: false,
      error: null,

      // State Setters
      setCurrentTier: tier => set({ currentTier: tier }),
      setAccessibleFeatures: features => set({ accessibleFeatures: features }),
      setTierFeatures: features => set({ tierFeatures: features }),
      setSpotlightFeatures: features => set({ spotlightFeatures: features }),
      setCustomProfileURL: url => set({ customProfileURL: url }),
      setAdvancedAnalytics: analytics => set({ advancedAnalytics: analytics }),
      setSupportTickets: tickets => set({ supportTickets: tickets }),
      setEarlyAccessFeatures: features =>
        set({ earlyAccessFeatures: features }),
      setEarlyAccessRequests: requests =>
        set({ earlyAccessRequests: requests }),
      setLoading: loading => set({ isLoading: loading }),
      setError: error => set({ error }),

      // Feature Access Methods
      checkFeatureAccess: async (featureName: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(
            `/api/features/access?feature_name=${featureName}`
          );
          if (!response.ok) {
            throw new Error('Failed to check feature access');
          }

          const data = await response.json();
          return data.accessible || false;
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      loadTierFeatures: async (tier: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`/api/features/tier?tier=${tier}`);
          if (!response.ok) {
            throw new Error('Failed to load tier features');
          }

          const data = await response.json();
          set({ tierFeatures: data.features || [] });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadSpotlightFeatures: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(
            `/api/features/spotlight?user_id=${userId}`
          );
          if (!response.ok) {
            throw new Error('Failed to load spotlight features');
          }

          const data = await response.json();
          set({ spotlightFeatures: data.spotlight_features || [] });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      createCustomProfileURL: async (customUrl: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/features/custom-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ custom_url: customUrl }),
          });

          if (!response.ok) {
            throw new Error('Failed to create custom profile URL');
          }

          const data = await response.json();
          set({ customProfileURL: data.custom_url });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadAdvancedAnalytics: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(
            `/api/features/analytics?user_id=${userId}`
          );
          if (!response.ok) {
            throw new Error('Failed to load analytics');
          }

          const data = await response.json();
          set({ advancedAnalytics: data.analytics });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadPrioritySupport: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(
            `/api/features/support?user_id=${userId}`
          );
          if (!response.ok) {
            throw new Error('Failed to load support features');
          }

          const data = await response.json();
          // Handle support data as needed
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadEarlyAccessFeatures: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(
            `/api/features/early-access?user_id=${userId}`
          );
          if (!response.ok) {
            throw new Error('Failed to load early access features');
          }

          const data = await response.json();
          set({ earlyAccessFeatures: data.early_access_features || [] });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'An error occurred',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      validateFeatureAccess: (featureName: string) => {
        const { accessibleFeatures, currentTier } = get();

        const feature = accessibleFeatures.find(
          f => f.feature_name === featureName
        );
        if (!feature) return false;

        // Check if feature is accessible and user has required tier
        const tierHierarchy = { essential: 1, showcase: 2, spotlight: 3 };
        const userTierLevel =
          tierHierarchy[currentTier as keyof typeof tierHierarchy] || 1;
        const requiredTierLevel =
          tierHierarchy[feature.tier_required as keyof typeof tierHierarchy] ||
          1;

        return feature.is_accessible && userTierLevel >= requiredTierLevel;
      },

      reset: () =>
        set({
          currentTier: 'essential',
          accessibleFeatures: [],
          tierFeatures: [],
          spotlightFeatures: [],
          customProfileURL: null,
          advancedAnalytics: null,
          supportTickets: [],
          earlyAccessFeatures: [],
          earlyAccessRequests: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'premium-features-storage',
      partialize: state => ({
        currentTier: state.currentTier,
        accessibleFeatures: state.accessibleFeatures,
        customProfileURL: state.customProfileURL,
      }),
    }
  )
);
