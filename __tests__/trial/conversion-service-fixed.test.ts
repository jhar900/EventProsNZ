import { TrialConversionService } from '@/lib/trial/conversion-service';
import { createClient } from '@/lib/supabase/server';
import {
  createFinalSupabaseMock,
  createErrorSupabaseMock,
} from '../mocks/supabase-final-mock';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('TrialConversionService - Fixed Tests', () => {
  let conversionService: TrialConversionService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create final mock for Supabase
    mockSupabase = createFinalSupabaseMock();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    conversionService = new TrialConversionService();
  });

  describe('Trial Conversion Creation', () => {
    it('should create trial conversion successfully', async () => {
      const conversionData = {
        userId: 'test-user-id',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
        conversionTier: 'showcase',
        conversionReason: 'trial_started',
      };

      const result =
        await conversionService.createTrialConversion(conversionData);

      expect(result).toBeDefined();
      expect(result).toBe('test-id');
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_conversions');
    });

    it('should handle creation failure', async () => {
      // Use error mock for this test
      const errorMock = createErrorSupabaseMock();
      (createClient as jest.Mock).mockReturnValue(errorMock);
      const errorService = new TrialConversionService();

      const conversionData = {
        userId: 'test-user-id',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
      };

      await expect(
        errorService.createTrialConversion(conversionData)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Trial Conversion Retrieval', () => {
    it('should get trial conversion successfully', async () => {
      const userId = 'test-user-id';
      const result = await conversionService.getTrialConversion(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.table).toBe('trial_conversions');
    });

    it('should handle retrieval failure', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const userId = 'test-user-id';

      await expect(
        conversionService.getTrialConversion(userId)
      ).rejects.toThrow('Failed to fetch trial conversion: Database error');
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversion for existing trial', async () => {
      const userId = 'test-user-id';
      const conversionStatus = 'converted';
      const conversionTier = 'showcase';
      const conversionReason = 'user_upgraded';

      const result = await conversionService.trackConversion(
        userId,
        conversionStatus,
        conversionTier,
        conversionReason
      );

      expect(result).toBeUndefined(); // trackConversion returns void
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_conversions');
    });

    it('should create new conversion if none exists', async () => {
      // Mock no existing conversion
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      const userId = 'test-user-id';
      const conversionStatus = 'converted';
      const conversionTier = 'showcase';

      const result = await conversionService.trackConversion(
        userId,
        conversionStatus,
        conversionTier
      );

      expect(result).toBeUndefined();
    });
  });

  describe('Trial Expiration Processing', () => {
    it('should process trial expiration successfully', async () => {
      const result = await conversionService.processTrialExpiration();

      expect(result).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_conversions');
    });

    it('should handle subscription update failure gracefully', async () => {
      // Mock subscription update error
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          error: { message: 'Subscription update failed' },
        }),
      });

      const result = await conversionService.processTrialExpiration();

      expect(result).toBeUndefined();
    });
  });

  describe('Conversion Metrics', () => {
    it('should get conversion metrics successfully', async () => {
      const result = await conversionService.getConversionMetrics();

      expect(result).toBeDefined();
      expect(result.totalTrials).toBe(100);
      expect(result.convertedTrials).toBe(30);
      expect(result.expiredTrials).toBe(20);
      expect(result.conversionRate).toBe(0.3);
      expect(result.avgTrialDuration).toBe('14 days');
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_trial_conversion_metrics'
      );
    });

    it('should return default metrics on failure', async () => {
      // Use error mock for this test
      const errorMock = createErrorSupabaseMock();
      (createClient as jest.Mock).mockReturnValue(errorMock);
      const errorService = new TrialConversionService();

      // The service should return default metrics when RPC fails
      const result = await errorService.getConversionMetrics();
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
    it('should handle database connection errors gracefully', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' },
        }),
      });

      const userId = 'test-user-id';

      await expect(
        conversionService.getTrialConversion(userId)
      ).rejects.toThrow('Failed to fetch trial conversion: Connection failed');
    });

    it('should handle invalid input data', async () => {
      const invalidData = {
        userId: '', // Invalid empty string
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
      };

      // This should not throw an error from the service itself
      // Validation should be handled at the API layer
      await expect(
        conversionService.createTrialConversion(invalidData)
      ).resolves.toBeDefined();
    });
  });
});
