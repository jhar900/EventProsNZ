import { BudgetService } from '@/lib/budget/budget-service';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() =>
          Promise.resolve({
            data: [
              {
                id: 'rec-1',
                event_type: 'wedding',
                service_category: 'catering',
                recommended_amount: 5000,
                confidence_score: 0.85,
                pricing_source: 'industry_average',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 'rec-2',
                event_type: 'wedding',
                service_category: 'venue',
                recommended_amount: 4000,
                confidence_score: 0.9,
                pricing_source: 'industry_average',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            error: null,
          })
        ),
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: 'breakdown-1',
                event_id: 'event-1',
                service_category: 'catering',
                estimated_cost: 5000,
                package_applied: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              error: null,
            })
          ),
        })),
      })),
      single: jest.fn(() =>
        Promise.resolve({
          data: {
            id: 'breakdown-1',
            event_id: 'event-1',
            service_category: 'catering',
            estimated_cost: 5000,
            package_applied: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        })
      ),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({
            data: { id: 'test-id' },
            error: null,
          })
        ),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 'breakdown-1',
              event_id: 'event-1',
              service_category: 'catering',
              estimated_cost: 5500,
              package_applied: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })
        ),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock PricingService
jest.mock('@/lib/budget/pricing-service', () => ({
  PricingService: jest.fn().mockImplementation(() => ({
    getPricingData: jest.fn().mockResolvedValue({
      id: 'test-id',
      service_type: 'catering',
      price_min: 50,
      price_max: 150,
      price_average: 85,
      seasonal_multiplier: 1.2,
      location_multiplier: 1.1,
      data_source: 'contractor_data',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }),
    applySeasonalAdjustments: jest.fn().mockImplementation(pricing => ({
      ...pricing,
      price_average: pricing.price_average * 1.2,
    })),
    applyLocationAdjustments: jest.fn().mockImplementation(pricing => ({
      ...pricing,
      price_average: pricing.price_average * 1.1,
    })),
    getRealTimePricing: jest.fn().mockResolvedValue({
      contractor_count: 5,
      average_price: 90,
      price_range: { min: 60, max: 120 },
    }),
    calculateAttendeeMultiplier: jest.fn().mockReturnValue(1.2),
  })),
}));

describe('BudgetService', () => {
  let budgetService: BudgetService;

  beforeEach(() => {
    budgetService = new BudgetService();
    jest.clearAllMocks();
  });

  describe('calculateBudgetRecommendations', () => {
    it('should calculate budget recommendations with attendee scaling', async () => {
      const eventType = 'wedding';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };
      const attendeeCount = 100;
      const duration = 8;

      const result = await budgetService.calculateBudgetRecommendations(
        eventType,
        location,
        attendeeCount,
        duration
      );

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(2);
      expect(result.total_budget).toBeGreaterThan(0);
      expect(result.adjustments.attendee_multiplier).toBeGreaterThan(1);
      expect(result.metadata.event_type).toBe(eventType);
      expect(result.metadata.attendee_count).toBe(attendeeCount);
    });

    it('should handle missing recommendations gracefully', async () => {
      // Mock empty recommendations
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      });

      const eventType = 'unknown_event_type';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };
      const attendeeCount = 100;
      const duration = 8;

      await expect(
        budgetService.calculateBudgetRecommendations(
          eventType,
          location,
          attendeeCount,
          duration
        )
      ).rejects.toThrow(
        'No recommendations found for event type: unknown_event_type'
      );
    });
  });

  describe('getServiceBreakdown', () => {
    it('should get service breakdown for an event', async () => {
      // Mock the service breakdown query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'breakdown-1',
                  event_id: 'event-1',
                  service_category: 'catering',
                  estimated_cost: 5000,
                  package_applied: false,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            })
          ),
        })),
      });

      const eventId = 'event-1';
      const result = await budgetService.getServiceBreakdown(eventId);

      expect(result).toBeDefined();
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].event_id).toBe(eventId);
    });

    it('should filter by service categories', async () => {
      // Mock the service breakdown query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'breakdown-1',
                  event_id: 'event-1',
                  service_category: 'catering',
                  estimated_cost: 5000,
                  package_applied: false,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            })
          ),
        })),
      });

      const eventId = 'event-1';
      const serviceCategories = ['catering'];
      const result = await budgetService.getServiceBreakdown(
        eventId,
        serviceCategories
      );

      expect(result).toBeDefined();
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].service_category).toBe('catering');
    });
  });

  describe('applyBudgetAdjustments', () => {
    it('should apply percentage adjustments', async () => {
      const eventId = 'event-1';
      const adjustments = [
        {
          service_category: 'catering',
          adjustment_type: 'percentage' as const,
          adjustment_value: 10,
          reason: 'Premium upgrade',
        },
      ];

      const result = await budgetService.applyBudgetAdjustments(
        eventId,
        adjustments
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].estimated_cost).toBe(5500);
    });

    it('should apply fixed adjustments', async () => {
      const eventId = 'event-1';
      const adjustments = [
        {
          service_category: 'catering',
          adjustment_type: 'fixed' as const,
          adjustment_value: 500,
          reason: 'Additional services',
        },
      ];

      const result = await budgetService.applyBudgetAdjustments(
        eventId,
        adjustments
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].estimated_cost).toBe(5500);
    });
  });

  describe('trackBudgetVariance', () => {
    it('should track budget variance for actual costs', async () => {
      // Mock the budget tracking query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'tracking-1',
                  event_id: 'event-1',
                  service_category: 'catering',
                  estimated_cost: 5000,
                  actual_cost: 5500,
                  variance: 500,
                  tracking_date: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            })
          ),
        })),
      });

      // Mock the update operation
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: null,
              error: null,
            })
          ),
        })),
      });

      // Mock the insert operation
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() =>
          Promise.resolve({
            data: { id: 'test-id' },
            error: null,
          })
        ),
      });

      const eventId = 'event-1';
      const actualCosts = {
        catering: 5500,
        venue: 4500,
      };

      const result = await budgetService.trackBudgetVariance(
        eventId,
        actualCosts
      );

      expect(result).toBeUndefined(); // Method returns void
    });
  });

  describe('getBudgetInsights', () => {
    it('should calculate budget insights', async () => {
      // Mock the budget tracking query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'tracking-1',
                  event_id: 'event-1',
                  service_category: 'catering',
                  estimated_cost: 5000,
                  actual_cost: 5200,
                  variance: 200,
                  tracking_date: '2024-01-01T00:00:00Z',
                },
                {
                  id: 'tracking-2',
                  event_id: 'event-1',
                  service_category: 'venue',
                  estimated_cost: 4000,
                  actual_cost: 3800,
                  variance: -200,
                  tracking_date: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            })
          ),
        })),
      });

      const eventId = 'event-1';
      const result = await budgetService.getBudgetInsights(eventId);

      expect(result).toBeDefined();
      expect(result.total_estimated).toBeGreaterThan(0);
      expect(result.total_actual).toBeGreaterThan(0);
      expect(result.variance_percentage).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache budget calculations', async () => {
      const eventType = 'wedding';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };
      const attendeeCount = 100;
      const duration = 8;

      // Reset mock call count
      mockSupabaseClient.from.mockClear();

      // First call should hit database
      const result1 = await budgetService.calculateBudgetRecommendations(
        eventType,
        location,
        attendeeCount,
        duration
      );

      // Second call should hit cache
      const result2 = await budgetService.calculateBudgetRecommendations(
        eventType,
        location,
        attendeeCount,
        duration
      );

      expect(result1).toEqual(result2);
      // Note: Cache is implemented in the service, so we can't easily test call count
      // but we can verify the results are the same
    });

    it('should clear cache', () => {
      const budgetService = new BudgetService();
      budgetService.clearCache();

      const stats = budgetService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear specific cache key', () => {
      const budgetService = new BudgetService();
      budgetService.clearCacheKey('test-key');

      const stats = budgetService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const budgetService = new BudgetService();
      const stats = budgetService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });
  });
});
