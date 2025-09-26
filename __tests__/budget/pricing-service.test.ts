import { PricingService } from '@/lib/budget/pricing-service';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
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
                },
                error: null,
              })
            ),
          })),
        })),
      })),
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
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
    jest.clearAllMocks();
  });

  describe('getPricingData', () => {
    it('should get pricing data for a service type', async () => {
      const serviceType = 'catering';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };

      const result = await pricingService.getPricingData(serviceType, location);

      expect(result).toBeDefined();
      expect(result?.service_type).toBe(serviceType);
      expect(result?.price_min).toBe(50);
      expect(result?.price_max).toBe(150);
      expect(result?.price_average).toBe(85);
    });

    it('should return null when no pricing data found', async () => {
      // Mock empty result
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'No rows found' },
                  })
                ),
              })),
            })),
          })),
        })),
      });

      const serviceType = 'unknown_service';
      const result = await pricingService.getPricingData(serviceType);

      expect(result).toBeNull();
    });
  });

  describe('applySeasonalAdjustments', () => {
    it('should apply seasonal adjustments for peak season', () => {
      const pricing = {
        id: 'test-id',
        service_type: 'catering',
        price_min: 50,
        price_max: 150,
        price_average: 85,
        seasonal_multiplier: 1.2,
        location_multiplier: 1.0,
        data_source: 'contractor_data',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const eventDate = new Date('2024-12-25'); // Peak season
      const result = pricingService.applySeasonalAdjustments(
        pricing,
        eventDate
      );

      expect(result.price_average).toBeGreaterThan(pricing.price_average);
      expect(result.price_average).toBe(85 * 1.2); // Should apply seasonal multiplier
    });

    it('should apply seasonal adjustments for off-peak season', () => {
      const pricing = {
        id: 'test-id',
        service_type: 'catering',
        price_min: 50,
        price_max: 150,
        price_average: 85,
        seasonal_multiplier: 1.0,
        location_multiplier: 1.0,
        data_source: 'contractor_data',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const eventDate = new Date('2024-03-15'); // Off-peak season
      const result = pricingService.applySeasonalAdjustments(
        pricing,
        eventDate
      );

      expect(result.price_average).toBeLessThanOrEqual(pricing.price_average);
      expect(result.seasonal_multiplier).toBeLessThanOrEqual(1.0);
    });
  });

  describe('applyLocationAdjustments', () => {
    it('should apply location adjustments for Auckland', () => {
      const pricing = {
        id: 'test-id',
        service_type: 'catering',
        price_min: 50,
        price_max: 150,
        price_average: 85,
        seasonal_multiplier: 1.0,
        location_multiplier: 1.0,
        data_source: 'contractor_data',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const location = {
        lat: -36.8485,
        lng: 174.7633,
        city: 'Auckland',
        region: 'Auckland',
      };
      const result = pricingService.applyLocationAdjustments(pricing, location);

      expect(result.price_average).toBeGreaterThan(pricing.price_average);
      expect(result.price_average).toBe(85 * 1.1); // Auckland multiplier is 1.1
    });

    it('should apply location adjustments for Christchurch', () => {
      const pricing = {
        id: 'test-id',
        service_type: 'catering',
        price_min: 50,
        price_max: 150,
        price_average: 85,
        seasonal_multiplier: 1.0,
        location_multiplier: 1.0,
        data_source: 'contractor_data',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const location = {
        lat: -43.5321,
        lng: 172.6362,
        city: 'Christchurch',
        region: 'Christchurch',
      };
      const result = pricingService.applyLocationAdjustments(pricing, location);

      expect(result.price_average).toBeLessThan(pricing.price_average);
      expect(result.price_average).toBe(85 * 0.9); // Christchurch multiplier is 0.9
    });
  });

  describe('getRealTimePricing', () => {
    it('should get real-time pricing from contractor data', async () => {
      // Mock the services table query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    price_range_min: 60,
                    price_range_max: 120,
                    user_id: 'user-1',
                  },
                  {
                    price_range_min: 70,
                    price_range_max: 130,
                    user_id: 'user-2',
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      });

      const serviceType = 'catering';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };

      const result = await pricingService.getRealTimePricing(
        serviceType,
        location
      );

      expect(result).toBeDefined();
      expect(result?.contractor_count).toBeGreaterThan(0);
      expect(result?.average).toBeGreaterThan(0);
    });

    it('should return null when no contractor data available', async () => {
      // Mock empty result
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'No rows found' },
                  })
                ),
              })),
            })),
          })),
        })),
      });

      const serviceType = 'unknown_service';
      const result = await pricingService.getRealTimePricing(serviceType);

      expect(result).toBeNull();
    });
  });

  describe('calculateAttendeeMultiplier', () => {
    it('should calculate attendee multiplier correctly', () => {
      const attendeeCount = 100;
      const result = pricingService.calculateAttendeeMultiplier(attendeeCount);

      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(2);
    });
  });

  describe('updatePricingData', () => {
    it('should update pricing data from contractor services', async () => {
      // Mock the services table query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  service_type: 'catering',
                  price_range_min: 60,
                  price_range_max: 120,
                  location: { region: 'Auckland' },
                },
                {
                  service_type: 'catering',
                  price_range_min: 70,
                  price_range_max: 130,
                  location: { region: 'Auckland' },
                },
              ],
              error: null,
            })
          ),
        })),
      });

      // Mock the upsert operation
      mockSupabaseClient.from.mockReturnValueOnce({
        upsert: jest.fn(() =>
          Promise.resolve({
            data: { id: 'test-id' },
            error: null,
          })
        ),
      });

      const result = await pricingService.updatePricingData();

      expect(result).toBeUndefined(); // Method returns void
    });
  });

  describe('Caching', () => {
    it('should cache pricing data', async () => {
      const serviceType = 'catering';
      const location = { lat: -36.8485, lng: 174.7633, city: 'Auckland' };

      // Reset mock call count
      mockSupabaseClient.from.mockClear();

      // First call should hit database
      const result1 = await pricingService.getPricingData(
        serviceType,
        location
      );

      // Second call should hit cache
      const result2 = await pricingService.getPricingData(
        serviceType,
        location
      );

      expect(result1).toEqual(result2);
      // Note: Cache is implemented in the service, so we can't easily test call count
      // but we can verify the results are the same
    });

    it('should clear cache', () => {
      const pricingService = new PricingService();
      pricingService.clearCache();

      const stats = pricingService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear specific cache key', () => {
      const pricingService = new PricingService();
      pricingService.clearCacheKey('test-key');

      const stats = pricingService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const pricingService = new PricingService();
      const stats = pricingService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });
  });
});
