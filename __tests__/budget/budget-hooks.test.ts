import { renderHook, act } from '@testing-library/react';
import { useBudgetPlanning } from '@/hooks/useBudgetPlanning';
import { useBudgetPlanningStore } from '@/stores/budget-planning';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [
                {
                  id: '1',
                  service_category: 'catering',
                  recommended_amount: 5000,
                  confidence_score: 0.8,
                  pricing_source: 'historical',
                },
              ],
              error: null,
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: '1', rating: 5 },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: { success: true },
          error: null,
        })),
      })),
      upsert: jest.fn(() => ({
        data: { success: true },
        error: null,
      })),
    })),
  })),
}));

describe('Budget Hooks', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('useBudgetPlanning', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBudgetPlanning());

      expect(result.current.budgetPlan).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.eventDetails).toEqual({
        eventType: '',
        attendeeCount: 0,
        duration: 0,
      });
    });

    it('should load budget recommendations', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recommendations: [
            {
              id: '1',
              service_category: 'catering',
              recommended_amount: 5000,
              confidence_score: 0.8,
              pricing_source: 'historical',
            },
          ],
          total_budget: 15000,
          metadata: {},
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.loadBudgetRecommendations(
          'wedding',
          { lat: 40.7128, lng: -74.006, city: 'New York' },
          100,
          8
        );
      });

      expect(result.current.budgetPlan).toBeDefined();
      expect(result.current.budgetPlan?.totalBudget).toBe(15000);
      expect(result.current.budgetPlan?.recommendations).toHaveLength(1);
      expect(result.current.eventDetails.eventType).toBe('wedding');
    });

    it('should handle loading errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.loadBudgetRecommendations('wedding');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.budgetPlan).toBeNull();
    });

    it('should load service breakdown', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          breakdown: [
            {
              service_category: 'catering',
              estimated_cost: 5000,
              actual_cost: 4500,
              variance: -500,
            },
          ],
          total: 5000,
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.loadServiceBreakdown('test-event-id');
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/breakdown?event_id=test-event-id'
      );
    });

    it('should load package deals', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          packages: [
            {
              id: '1',
              name: 'Wedding Package',
              description: 'Complete wedding package',
              service_categories: ['catering', 'photography'],
              base_price: 10000,
              discount_percentage: 15,
              final_price: 8500,
              savings: 1500,
            },
          ],
          savings: 1500,
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.loadPackageDeals('wedding', {
          lat: 40.7128,
          lng: -74.006,
        });
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/budget/packages')
      );
    });

    it('should load budget tracking', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracking: [
            {
              id: '1',
              service_category: 'catering',
              estimated_cost: 5000,
              actual_cost: 4500,
              variance: -500,
              tracking_date: '2024-01-01T00:00:00Z',
            },
          ],
          insights: {
            total_estimated: 5000,
            total_actual: 4500,
            total_variance: -500,
            variance_percentage: -10,
            categories_tracked: 1,
            accuracy_score: 0.9,
            cost_savings: [],
            over_budget_categories: [],
            recommendations: [],
          },
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.loadBudgetTracking('test-event-id');
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/tracking?event_id=test-event-id'
      );
    });

    it('should apply budget adjustments', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          breakdown: [
            {
              service_category: 'catering',
              estimated_cost: 5500,
              adjustment_reason: 'Increased guest count',
            },
          ],
          total: 5500,
          success: true,
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      const adjustments = [
        {
          service_category: 'catering',
          adjustment_type: 'percentage' as const,
          adjustment_value: 10,
          reason: 'Increased guest count',
        },
      ];

      await act(async () => {
        await result.current.applyBudgetAdjustment(
          'test-event-id',
          adjustments
        );
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/breakdown',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: 'test-event-id',
            service_categories: ['catering'],
            adjustments,
          }),
        })
      );
    });

    it('should update budget tracking', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracking: {
            id: '1',
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            tracking_date: '2024-01-01T00:00:00Z',
          },
          success: true,
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.updateBudgetTracking(
          'test-event-id',
          'catering',
          4500
        );
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/tracking',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: 'test-event-id',
            service_category: 'catering',
            actual_cost: 4500,
          }),
        })
      );
    });

    it('should apply package deals', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          applied_package: {
            id: '1',
            name: 'Wedding Package',
            final_price: 8500,
            savings: 1500,
          },
          success: true,
          event_updated: true,
          budget_updated: true,
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.applyPackageDeal('test-event-id', 'package-1');
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/packages/apply',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: 'test-event-id',
            package_id: 'package-1',
          }),
        })
      );
    });

    it('should submit recommendation feedback', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          feedback: { id: '1', rating: 5 },
          updated_recommendation: {
            id: '1',
            service_category: 'catering',
            recommended_amount: 5000,
            confidence_score: 0.85,
            pricing_source: 'historical',
          },
        }),
      });

      const { result } = renderHook(() => useBudgetPlanning());

      await act(async () => {
        await result.current.submitRecommendationFeedback(
          'rec-1',
          5,
          'Great recommendation!'
        );
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/budget/recommendations/feedback',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recommendation_id: 'rec-1',
            feedback_type: 'rating',
            rating: 5,
            comments: 'Great recommendation!',
          }),
        })
      );
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useBudgetPlanning());

      // Simulate an error by triggering a failed operation
      act(() => {
        result.current.loadBudgetRecommendations(
          'wedding',
          {
            lat: -36.8485,
            lng: 174.7633,
            city: 'Auckland',
            region: 'Auckland',
          },
          100,
          8
        );
      });

      // Wait for the error to be set
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('useBudgetPlanningStore', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      expect(result.current.budgetPlan).toBeNull();
      expect(result.current.eventDetails).toEqual({
        eventType: '',
        attendeeCount: 0,
        duration: 0,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set budget plan', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      expect(result.current.budgetPlan).toEqual(budgetPlan);
    });

    it('should set event details', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const eventDetails = {
        eventType: 'wedding',
        location: { lat: 40.7128, lng: -74.006, city: 'New York' },
        attendeeCount: 100,
        duration: 8,
      };

      act(() => {
        result.current.setEventDetails(eventDetails);
      });

      expect(result.current.eventDetails).toEqual(eventDetails);
    });

    it('should add service breakdown', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      const breakdown = {
        service_category: 'catering',
        estimated_cost: 5000,
        actual_cost: 4500,
        variance: -500,
        confidence_score: 0.8,
      };

      act(() => {
        result.current.addServiceBreakdown(breakdown);
      });

      expect(result.current.budgetPlan?.serviceBreakdown).toHaveLength(1);
      expect(result.current.budgetPlan?.serviceBreakdown[0]).toEqual(breakdown);
    });

    it('should update service breakdown', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [
          {
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            confidence_score: 0.8,
          },
        ],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      act(() => {
        result.current.updateServiceBreakdown('catering', {
          estimated_cost: 5500,
        });
      });

      expect(
        result.current.budgetPlan?.serviceBreakdown[0].estimated_cost
      ).toBe(5500);
    });

    it('should remove service breakdown', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [
          {
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            confidence_score: 0.8,
          },
        ],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      act(() => {
        result.current.removeServiceBreakdown('catering');
      });

      expect(result.current.budgetPlan?.serviceBreakdown).toHaveLength(0);
    });

    it('should calculate total estimated', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [
          {
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            confidence_score: 0.8,
          },
          {
            service_category: 'photography',
            estimated_cost: 2000,
            actual_cost: 2200,
            variance: 200,
            confidence_score: 0.9,
          },
        ],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      expect(result.current.getTotalEstimated()).toBe(7000);
    });

    it('should calculate total actual', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [],
        recommendations: [],
        packages: [],
        tracking: [
          {
            id: '1',
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            tracking_date: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            service_category: 'photography',
            estimated_cost: 2000,
            actual_cost: 2200,
            variance: 200,
            tracking_date: '2024-01-01T00:00:00Z',
          },
        ],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      expect(result.current.getTotalActual()).toBe(6700);
    });

    it('should calculate total variance', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [
          {
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            confidence_score: 0.8,
          },
        ],
        recommendations: [],
        packages: [],
        tracking: [
          {
            id: '1',
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            tracking_date: '2024-01-01T00:00:00Z',
          },
        ],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      expect(result.current.getTotalVariance()).toBe(-500);
    });

    it('should calculate budget health', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [
          {
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            confidence_score: 0.8,
          },
        ],
        recommendations: [],
        packages: [],
        tracking: [
          {
            id: '1',
            service_category: 'catering',
            estimated_cost: 5000,
            actual_cost: 4500,
            variance: -500,
            tracking_date: '2024-01-01T00:00:00Z',
          },
        ],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
      });

      expect(result.current.getBudgetHealth()).toBe('excellent');
    });

    it('should reset store', () => {
      const { result } = renderHook(() => useBudgetPlanningStore());

      const budgetPlan = {
        totalBudget: 15000,
        serviceBreakdown: [],
        recommendations: [],
        packages: [],
        tracking: [],
        adjustments: [],
      };

      act(() => {
        result.current.setBudgetPlan(budgetPlan);
        result.current.setEventDetails({
          eventType: 'wedding',
          attendeeCount: 100,
          duration: 8,
        });
        result.current.setLoading(true);
        result.current.setError('Test error');
      });

      expect(result.current.budgetPlan).toEqual(budgetPlan);
      expect(result.current.eventDetails.eventType).toBe('wedding');
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.resetStore();
      });

      expect(result.current.budgetPlan).toBeNull();
      expect(result.current.eventDetails).toEqual({
        eventType: '',
        attendeeCount: 0,
        duration: 0,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
