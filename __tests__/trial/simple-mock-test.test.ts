import { TrialConversionService } from '@/lib/trial/conversion-service';
import { TrialAnalyticsService } from '@/lib/trial/analytics-service';
import { createClient } from '@/lib/supabase/server';
import { createFinalSupabaseMock } from '../mocks/supabase-final-mock';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Trial System - Simple Mock Test', () => {
  let conversionService: TrialConversionService;
  let analyticsService: TrialAnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create final mock for Supabase
    mockSupabase = createFinalSupabaseMock();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    conversionService = new TrialConversionService();
    analyticsService = new TrialAnalyticsService();
  });

  describe('Basic Functionality', () => {
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

    it('should get trial conversion successfully', async () => {
      const userId = 'test-user-id';
      const result = await conversionService.getTrialConversion(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.table).toBe('trial_conversions');
    });

    it('should track conversion successfully', async () => {
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

    it('should process trial expiration successfully', async () => {
      const result = await conversionService.processTrialExpiration();

      expect(result).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabase.from).toHaveBeenCalledWith('trial_conversions');
    });

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

    it('should track trial analytics successfully', async () => {
      const userId = 'test-user-id';
      const trialDay = 2;
      const featureUsage = {
        profile_completion: 0.8,
        portfolio_uploads: 3,
        search_usage: 5,
        contact_usage: 2,
      };
      const platformEngagement = {
        login_frequency: 0.7,
        feature_usage_score: 0.6,
        time_spent: 1200,
      };

      const result = await analyticsService.trackTrialAnalytics(
        userId,
        trialDay,
        featureUsage,
        platformEngagement
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.table).toBe('trial_analytics');
    });

    it('should get trial analytics successfully', async () => {
      const userId = 'test-user-id';
      const result = await analyticsService.getTrialAnalytics(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get trial insights successfully', async () => {
      const userId = 'test-user-id';
      const result = await analyticsService.getTrialInsights(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Method Chaining Verification', () => {
    it('should handle complex method chaining for insert operations', async () => {
      const conversionData = {
        userId: 'test-user-id',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conversionStatus: 'active' as const,
      };

      // This should not throw an error due to method chaining
      await expect(
        conversionService.createTrialConversion(conversionData)
      ).resolves.toBeDefined();
    });

    it('should handle complex method chaining for update operations', async () => {
      const userId = 'test-user-id';
      const conversionStatus = 'converted';
      const conversionTier = 'showcase';

      // This should not throw an error due to method chaining
      await expect(
        conversionService.trackConversion(
          userId,
          conversionStatus,
          conversionTier
        )
      ).resolves.toBeUndefined();
    });

    it('should handle complex method chaining for select operations', async () => {
      const userId = 'test-user-id';

      // This should not throw an error due to method chaining
      await expect(
        conversionService.getTrialConversion(userId)
      ).resolves.toBeDefined();
    });

    it('should handle complex method chaining for analytics operations', async () => {
      const userId = 'test-user-id';
      const trialDay = 2;
      const featureUsage = {
        profile_completion: 0.8,
        portfolio_uploads: 3,
        search_usage: 5,
        contact_usage: 2,
      };
      const platformEngagement = {
        login_frequency: 0.7,
        feature_usage_score: 0.6,
        time_spent: 1200,
      };

      // This should not throw an error due to method chaining
      await expect(
        analyticsService.trackTrialAnalytics(
          userId,
          trialDay,
          featureUsage,
          platformEngagement
        )
      ).resolves.toBeDefined();
    });
  });
});
