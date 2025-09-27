'use client';

import { useState, useEffect } from 'react';

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

interface BudgetPlanningState {
  budgetPlan: BudgetPlan | null;
  isLoading: boolean;
  error: string | null;
  eventDetails: {
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
  };
}

export function useBudgetPlanning() {
  const [state, setState] = useState<BudgetPlanningState>({
    budgetPlan: null,
    isLoading: false,
    error: null,
    eventDetails: {
      eventType: '',
      attendeeCount: 0,
      duration: 0,
    },
  });

  const loadBudgetRecommendations = async (
    eventType: string,
    location?: any,
    attendeeCount?: number,
    duration?: number
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        event_type: eventType,
        attendee_count: attendeeCount?.toString() || '0',
        duration: duration?.toString() || '0',
      });

      if (location) {
        params.append('location', JSON.stringify(location));
      }

      const response = await fetch(`/api/budget/recommendations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load budget recommendations');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        budgetPlan: {
          totalBudget: data.total_budget,
          serviceBreakdown: [],
          recommendations: data.recommendations,
          packages: [],
          tracking: [],
          adjustments: [],
        },
        eventDetails: {
          eventType,
          location,
          attendeeCount: attendeeCount || 0,
          duration: duration || 0,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadServiceBreakdown = async (eventId: string) => {
    try {
      const response = await fetch(`/api/budget/breakdown?event_id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                serviceBreakdown: data.breakdown,
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const loadPackageDeals = async (eventType: string, location?: any) => {
    try {
      const params = new URLSearchParams({
        event_type: eventType,
      });

      if (location) {
        params.append('location', JSON.stringify(location));
      }

      const response = await fetch(`/api/budget/packages?${params}`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                packages: data.packages,
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const loadBudgetTracking = async (eventId: string) => {
    try {
      const response = await fetch(`/api/budget/tracking?event_id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                tracking: data.tracking,
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const applyBudgetAdjustment = async (
    eventId: string,
    adjustments: BudgetAdjustment[]
  ) => {
    try {
      const response = await fetch('/api/budget/breakdown', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          service_categories: adjustments.map(adj => adj.service_category),
          adjustments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                serviceBreakdown: data.breakdown,
                adjustments: [...prev.budgetPlan.adjustments, ...adjustments],
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const updateBudgetTracking = async (
    eventId: string,
    serviceCategory: string,
    actualCost: number
  ) => {
    try {
      const response = await fetch('/api/budget/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          service_category: serviceCategory,
          actual_cost: actualCost,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                tracking: prev.budgetPlan.tracking.map(item =>
                  item.service_category === serviceCategory
                    ? data.tracking
                    : item
                ),
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const applyPackageDeal = async (eventId: string, packageId: string) => {
    try {
      const response = await fetch('/api/budget/packages/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          package_id: packageId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                totalBudget: data.applied_package.final_price,
                packages: [...prev.budgetPlan.packages, data.applied_package],
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const submitRecommendationFeedback = async (
    recommendationId: string,
    rating: number,
    comments?: string
  ) => {
    try {
      const response = await fetch('/api/budget/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          feedback_type: 'rating',
          rating,
          comments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          budgetPlan: prev.budgetPlan
            ? {
                ...prev.budgetPlan,
                recommendations: prev.budgetPlan.recommendations.map(rec =>
                  rec.id === recommendationId
                    ? data.updated_recommendation
                    : rec
                ),
              }
            : null,
        }));
      }
    } catch (error) {
      }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    loadBudgetRecommendations,
    loadServiceBreakdown,
    loadPackageDeals,
    loadBudgetTracking,
    applyBudgetAdjustment,
    updateBudgetTracking,
    applyPackageDeal,
    submitRecommendationFeedback,
    clearError,
  };
}
