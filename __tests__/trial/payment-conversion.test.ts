import { TrialConversionService } from '@/lib/trial/conversion-service';

// Mock Supabase client with comprehensive method chaining
const mockSupabase = {
  from: jest.fn().mockImplementation((table: string) => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    };

    // Configure specific table behaviors
    if (table === 'trial_conversions') {
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'conversion-1',
          user_id: 'test-user-id',
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          conversion_status: 'active',
          conversion_tier: 'showcase',
          conversion_reason: 'trial_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });
      mockQuery.insert.mockResolvedValue({
        data: {
          id: 'conversion-1',
          user_id: 'test-user-id',
          conversion_status: 'converted',
          conversion_tier: 'showcase',
          conversion_reason: 'payment_successful',
        },
        error: null,
      });
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: { success: true },
          error: null,
        }),
      });
    } else if (table === 'subscriptions') {
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'subscription-1',
          user_id: 'test-user-id',
          tier: 'trial',
          status: 'trial',
          billing_cycle: 'monthly',
          price: 0,
          start_date: new Date().toISOString(),
          trial_end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: { success: true },
            error: null,
          }),
        }),
      });
    }

    return mockQuery;
  }),
  rpc: jest.fn().mockResolvedValue({
    data: {
      total_trials: 100,
      converted_trials: 30,
      expired_trials: 20,
      conversion_rate: 0.3,
      avg_trial_duration: '14 days',
      revenue: 5000,
      total_conversions: 10,
    },
    error: null,
  }),
};

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('TrialConversionService - Payment Conversion Tests', () => {
  let conversionService: TrialConversionService;

  beforeEach(() => {
    jest.clearAllMocks();
    conversionService = new TrialConversionService();
  });

  describe('Payment Conversion Scenarios', () => {
    it('should handle successful payment conversion', async () => {
      const userId = 'test-user-id';
      const conversionStatus = 'converted';
      const conversionTier = 'showcase';
      const conversionReason = 'payment_successful';

      // Mock successful conversion
      mockSupabase.from.mockImplementation((table: string) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'conversion-1',
              user_id: userId,
              conversion_status: conversionStatus,
              conversion_tier: conversionTier,
              conversion_reason: conversionReason,
            },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: { success: true },
                error: null,
              }),
            }),
          }),
        };
        return mockQuery;
      });

      // trackConversion doesn't return a value, so we just verify it doesn't throw
      await expect(
        conversionService.trackConversion(
          userId,
          conversionStatus,
          conversionTier,
          conversionReason
        )
      ).resolves.not.toThrow();
    });

    it('should handle payment failure gracefully', async () => {
      const userId = 'test-user-id';
      const conversionStatus = 'failed';
      const conversionTier = null;
      const conversionReason = 'payment_failed';

      // Mock failed conversion
      mockSupabase.from.mockImplementation((table: string) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'conversion-1',
              user_id: userId,
              conversion_status: conversionStatus,
              conversion_tier: conversionTier,
              conversion_reason: conversionReason,
            },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: { success: true },
              error: null,
            }),
          }),
        };
        return mockQuery;
      });

      // trackConversion doesn't return a value, so we just verify it doesn't throw
      await expect(
        conversionService.trackConversion(
          userId,
          conversionStatus,
          conversionTier,
          conversionReason
        )
      ).resolves.not.toThrow();
    });

    it('should handle trial expiration with automatic downgrade', async () => {
      // Mock trial expiration processing
      mockSupabase.from.mockImplementation((table: string) => {
        const mockQuery = {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lt: jest.fn().mockResolvedValue({
                data: { success: true },
                error: null,
              }),
            }),
          }),
        };
        return mockQuery;
      });

      // processTrialExpiration doesn't return a value, so we just verify it doesn't throw
      await expect(
        conversionService.processTrialExpiration()
      ).resolves.not.toThrow();
    });
  });

  describe('Conversion Metrics', () => {
    it('should calculate conversion metrics correctly', async () => {
      const result = await conversionService.getConversionMetrics();

      expect(result).toBeDefined();
      expect(result.totalTrials).toBe(100);
      expect(result.convertedTrials).toBe(30);
      expect(result.expiredTrials).toBe(20);
      expect(result.conversionRate).toBe(0.3);
      expect(result.avgTrialDuration).toBe('14 days');
    });

    it('should handle metrics calculation errors', async () => {
      // Mock RPC error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC function not found' },
      });

      // The service should return default metrics when RPC fails
      const result = await conversionService.getConversionMetrics();
      expect(result).toEqual({
        totalTrials: 0,
        convertedTrials: 0,
        expiredTrials: 0,
        conversionRate: 0,
        avgTrialDuration: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database connection error
      mockSupabase.from.mockImplementation((table: string) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' },
          }),
        };
        return mockQuery;
      });

      const userId = 'test-user-id';

      await expect(
        conversionService.getTrialConversion(userId)
      ).rejects.toThrow('Failed to fetch trial conversion: Connection failed');
    });

    it('should handle invalid input data', async () => {
      const invalidData = {
        userId: '',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
        conversionTier: 'showcase' as const,
        conversionReason: 'trial_started',
      };

      await expect(
        conversionService.createTrialConversion(invalidData)
      ).rejects.toThrow();
    });
  });
});
