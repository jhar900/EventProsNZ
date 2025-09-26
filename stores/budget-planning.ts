import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BudgetPlan {
  totalBudget: number;
  serviceBreakdown: ServiceBreakdown[];
  recommendations: BudgetRecommendation[];
  packages: PackageDeal[];
  tracking: BudgetTracking[];
  adjustments: BudgetAdjustment[];
}

interface ServiceBreakdown {
  service_category: string;
  estimated_cost: number;
  actual_cost?: number;
  variance?: number;
  confidence_score?: number;
}

interface BudgetRecommendation {
  id: string;
  service_category: string;
  recommended_amount: number;
  confidence_score: number;
  pricing_source: string;
}

interface PackageDeal {
  id: string;
  name: string;
  description: string;
  service_categories: string[];
  base_price: number;
  discount_percentage: number;
  final_price: number;
  savings: number;
}

interface BudgetTracking {
  id: string;
  service_category: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  tracking_date: string;
}

interface BudgetAdjustment {
  service_category: string;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  reason: string;
}

interface EventDetails {
  eventType: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
  };
  attendeeCount: number;
  duration: number;
}

interface BudgetPlanningStore {
  // State
  budgetPlan: BudgetPlan | null;
  eventDetails: EventDetails;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBudgetPlan: (budgetPlan: BudgetPlan | null) => void;
  setEventDetails: (eventDetails: EventDetails) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Budget Plan Actions
  updateTotalBudget: (totalBudget: number) => void;
  addServiceBreakdown: (breakdown: ServiceBreakdown) => void;
  updateServiceBreakdown: (
    category: string,
    breakdown: Partial<ServiceBreakdown>
  ) => void;
  removeServiceBreakdown: (category: string) => void;

  addRecommendation: (recommendation: BudgetRecommendation) => void;
  updateRecommendation: (
    id: string,
    recommendation: Partial<BudgetRecommendation>
  ) => void;
  removeRecommendation: (id: string) => void;

  addPackage: (packageDeal: PackageDeal) => void;
  removePackage: (id: string) => void;

  addTracking: (tracking: BudgetTracking) => void;
  updateTracking: (id: string, tracking: Partial<BudgetTracking>) => void;
  removeTracking: (id: string) => void;

  addAdjustment: (adjustment: BudgetAdjustment) => void;
  removeAdjustment: (category: string) => void;

  // Utility Actions
  clearBudgetPlan: () => void;
  resetStore: () => void;

  // Computed Values
  getTotalEstimated: () => number;
  getTotalActual: () => number;
  getTotalVariance: () => number;
  getBudgetHealth: () => 'excellent' | 'good' | 'fair' | 'poor';
}

const initialEventDetails: EventDetails = {
  eventType: '',
  attendeeCount: 0,
  duration: 0,
};

const initialBudgetPlan: BudgetPlan = {
  totalBudget: 0,
  serviceBreakdown: [],
  recommendations: [],
  packages: [],
  tracking: [],
  adjustments: [],
};

export const useBudgetPlanningStore = create<BudgetPlanningStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      budgetPlan: null,
      eventDetails: initialEventDetails,
      isLoading: false,
      error: null,

      // Basic Actions
      setBudgetPlan: budgetPlan => set({ budgetPlan }),
      setEventDetails: eventDetails => set({ eventDetails }),
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),

      // Budget Plan Actions
      updateTotalBudget: totalBudget =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? { ...state.budgetPlan, totalBudget }
            : null,
        })),

      addServiceBreakdown: breakdown =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                serviceBreakdown: [
                  ...state.budgetPlan.serviceBreakdown,
                  breakdown,
                ],
              }
            : null,
        })),

      updateServiceBreakdown: (category, breakdown) =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                serviceBreakdown: state.budgetPlan.serviceBreakdown.map(item =>
                  item.service_category === category
                    ? { ...item, ...breakdown }
                    : item
                ),
              }
            : null,
        })),

      removeServiceBreakdown: category =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                serviceBreakdown: state.budgetPlan.serviceBreakdown.filter(
                  item => item.service_category !== category
                ),
              }
            : null,
        })),

      addRecommendation: recommendation =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                recommendations: [
                  ...state.budgetPlan.recommendations,
                  recommendation,
                ],
              }
            : null,
        })),

      updateRecommendation: (id, recommendation) =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                recommendations: state.budgetPlan.recommendations.map(item =>
                  item.id === id ? { ...item, ...recommendation } : item
                ),
              }
            : null,
        })),

      removeRecommendation: id =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                recommendations: state.budgetPlan.recommendations.filter(
                  item => item.id !== id
                ),
              }
            : null,
        })),

      addPackage: packageDeal =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                packages: [...state.budgetPlan.packages, packageDeal],
              }
            : null,
        })),

      removePackage: id =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                packages: state.budgetPlan.packages.filter(
                  item => item.id !== id
                ),
              }
            : null,
        })),

      addTracking: tracking =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                tracking: [...state.budgetPlan.tracking, tracking],
              }
            : null,
        })),

      updateTracking: (id, tracking) =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                tracking: state.budgetPlan.tracking.map(item =>
                  item.id === id ? { ...item, ...tracking } : item
                ),
              }
            : null,
        })),

      removeTracking: id =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                tracking: state.budgetPlan.tracking.filter(
                  item => item.id !== id
                ),
              }
            : null,
        })),

      addAdjustment: adjustment =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                adjustments: [...state.budgetPlan.adjustments, adjustment],
              }
            : null,
        })),

      removeAdjustment: category =>
        set(state => ({
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                adjustments: state.budgetPlan.adjustments.filter(
                  item => item.service_category !== category
                ),
              }
            : null,
        })),

      // Utility Actions
      clearBudgetPlan: () => set({ budgetPlan: null }),

      resetStore: () =>
        set({
          budgetPlan: null,
          eventDetails: initialEventDetails,
          isLoading: false,
          error: null,
        }),

      // Computed Values
      getTotalEstimated: () => {
        const state = get();
        return (
          state.budgetPlan?.serviceBreakdown.reduce(
            (sum, item) => sum + item.estimated_cost,
            0
          ) || 0
        );
      },

      getTotalActual: () => {
        const state = get();
        return (
          state.budgetPlan?.tracking.reduce(
            (sum, item) => sum + item.actual_cost,
            0
          ) || 0
        );
      },

      getTotalVariance: () => {
        const state = get();
        const totalEstimated = state.getTotalEstimated();
        const totalActual = state.getTotalActual();
        return totalActual - totalEstimated;
      },

      getBudgetHealth: () => {
        const state = get();
        const totalEstimated = state.getTotalEstimated();
        const totalActual = state.getTotalActual();
        const variance = totalActual - totalEstimated;
        const variancePercentage =
          totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

        if (variancePercentage > 20) return 'poor';
        if (variancePercentage > 10) return 'fair';
        if (variancePercentage > -5) return 'good';
        return 'excellent';
      },
    }),
    {
      name: 'budget-planning-store',
    }
  )
);
