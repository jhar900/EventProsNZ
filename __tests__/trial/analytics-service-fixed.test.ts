import { TrialAnalyticsService } from '@/lib/trial/analytics-service';
import { createClient } from '@/lib/supabase/server';
import { createFinalSupabaseMock } from '../mocks/supabase-final-mock';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('TrialAnalyticsService - Fixed Tests', () => {
  let analyticsService: TrialAnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create final mock for Supabase
    mockSupabase = createFinalSupabaseMock();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    analyticsService = new TrialAnalyticsService();
  });

  describe('Analytics Tracking', () => {
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

    it('should handle tracking failure', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

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

      await expect(
        analyticsService.trackTrialAnalytics(
          userId,
          trialDay,
          featureUsage,
          platformEngagement
        )
      ).rejects.toThrow('Failed to track trial analytics: Database error');
    });
  });

  describe('Analytics Retrieval', () => {
    it('should get trial analytics successfully', async () => {
      const userId = 'test-user-id';
      const result = await analyticsService.getTrialAnalytics(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle retrieval failure', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const userId = 'test-user-id';

      await expect(analyticsService.getTrialAnalytics(userId)).rejects.toThrow(
        'Failed to fetch trial analytics: Database error'
      );
    });
  });

  describe('Insights Generation', () => {
    it('should generate trial insights successfully', async () => {
      const userId = 'test-user-id';
      const result = await analyticsService.getTrialInsights(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle insights generation failure', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const userId = 'test-user-id';

      await expect(analyticsService.getTrialInsights(userId)).rejects.toThrow(
        'Failed to fetch trial insights: Database error'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input data', async () => {
      const userId = 'test-user-id';
      const trialDay = 2;
      const featureUsage = null; // Invalid input
      const platformEngagement = null; // Invalid input

      const result = await analyticsService.trackTrialAnalytics(
        userId,
        trialDay,
        featureUsage,
        platformEngagement
      );

      expect(result).toBeDefined();
      // Should handle null inputs gracefully
    });

    it('should handle database connection errors', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const userId = 'test-user-id';

      await expect(analyticsService.getTrialAnalytics(userId)).rejects.toThrow(
        'Failed to fetch trial analytics: Database error'
      );
    });
  });
});
