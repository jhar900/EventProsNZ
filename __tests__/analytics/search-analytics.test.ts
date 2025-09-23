import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the Supabase client with proper chaining
const mockSupabaseClient = {
  from: jest.fn(() => ({
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
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'test-id' },
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Import the service after mocking
import { searchAnalyticsService } from '@/lib/analytics/search-analytics';

describe('SearchAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackSearchQuery', () => {
    it('should track a search query successfully', async () => {
      const mockData = {
        user_id: 'user-123',
        query: 'photographer',
        filters: { location: 'Auckland' },
        result_count: 15,
        session_id: 'session-123',
      };

      const result = await searchAnalyticsService.trackSearchQuery(mockData);
      expect(result).toBeDefined();
    });

    it('should handle errors when tracking search query', async () => {
      const mockData = {
        user_id: 'user-123',
        query: 'photographer',
        result_count: 15,
      };

      // Mock error response
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockReturnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          })
        );

      const result = await searchAnalyticsService.trackSearchQuery(mockData);
      expect(result).toBeNull();
    });
  });

  describe('trackSearchFilter', () => {
    it('should track a search filter successfully', async () => {
      const mockData = {
        user_id: 'user-123',
        filter_type: 'service_type',
        filter_value: 'photography',
        search_session_id: 'session-123',
      };

      const result = await searchAnalyticsService.trackSearchFilter(mockData);
      expect(result).toBeDefined();
    });
  });

  describe('trackSearchClick', () => {
    it('should track a search click successfully', async () => {
      const mockData = {
        user_id: 'user-123',
        contractor_id: 'contractor-456',
        search_query_id: 'query-789',
        click_position: 2,
      };

      const result = await searchAnalyticsService.trackSearchClick(mockData);
      expect(result).toBeDefined();
    });
  });

  describe('startSearchSession', () => {
    it('should start a search session successfully', async () => {
      const userId = 'user-123';
      const result = await searchAnalyticsService.startSearchSession(userId);
      expect(result).toBeDefined();
    });
  });

  describe('endSearchSession', () => {
    it('should end a search session successfully', async () => {
      const sessionId = 'session-123';
      const totalQueries = 5;
      const totalClicks = 3;

      const result = await searchAnalyticsService.endSearchSession(
        sessionId,
        totalQueries,
        totalClicks
      );
      expect(result).toBeDefined();
    });
  });

  describe('recordPerformanceMetric', () => {
    it('should record a performance metric successfully', async () => {
      const mockData = {
        metric_type: 'search',
        metric_name: 'response_time',
        metric_value: 150,
        metadata: { endpoint: '/api/search' },
      };

      const result =
        await searchAnalyticsService.recordPerformanceMetric(mockData);
      expect(result).toBeDefined();
    });
  });

  describe('createABTest', () => {
    it('should create an A/B test successfully', async () => {
      const mockData = {
        name: 'Search Algorithm Test',
        description: 'Testing new search algorithm',
        test_type: 'search_algorithm',
        control_config: { algorithm: 'old' },
        variant_config: { algorithm: 'new' },
      };

      const result = await searchAnalyticsService.createABTest(mockData);
      expect(result).toBeDefined();
    });
  });

  describe('recordABTestResult', () => {
    it('should record an A/B test result successfully', async () => {
      const mockData = {
        test_id: 'test-123',
        user_id: 'user-123',
        variant: 'control' as const,
        metric_name: 'click_through_rate',
        metric_value: 0.15,
      };

      const result = await searchAnalyticsService.recordABTestResult(mockData);
      expect(result).toBeDefined();
    });
  });

  describe('Analytics Data Fetching', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            queries: [{ query: 'test', search_count: 10 }],
            filters: [{ filter_type: 'location', usage_count: 5 }],
            ctr_metrics: { click_through_rate: 0.12 },
            trending_terms: [{ query: 'photographer', search_count: 20 }],
            behavior_metrics: { avg_session_duration: 120 },
            engagement_metrics: { daily_active_users: 100 },
            performance_metrics: { avg_response_time: 200 },
            tests: [{ id: 'test-1', name: 'Test 1' }],
          }),
      });
    });

    it('should fetch query analytics', async () => {
      const result = await searchAnalyticsService.getQueryAnalytics('week', 50);
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/queries?period=week&limit=50'
      );
    });

    it('should fetch filter analytics', async () => {
      const result = await searchAnalyticsService.getFilterAnalytics('week');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/filters?period=week'
      );
    });

    it('should fetch CTR analytics', async () => {
      const result = await searchAnalyticsService.getCTRAnalytics('week');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/clickthrough?period=week'
      );
    });

    it('should fetch trending data', async () => {
      const result = await searchAnalyticsService.getTrendingData('week', 20);
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/trending?period=week&limit=20'
      );
    });

    it('should fetch behavior analytics', async () => {
      const result = await searchAnalyticsService.getBehaviorAnalytics(
        'week',
        'all'
      );
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/behavior?period=week&user_segment=all'
      );
    });

    it('should fetch engagement metrics', async () => {
      const result = await searchAnalyticsService.getEngagementMetrics('week');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/search/engagement?period=week'
      );
    });

    it('should fetch performance metrics', async () => {
      const result = await searchAnalyticsService.getPerformanceMetrics('week');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/performance/search?period=week'
      );
    });

    it('should fetch A/B tests', async () => {
      const result = await searchAnalyticsService.getABTests();
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/ab-tests');
    });

    it('should fetch A/B test results', async () => {
      const result = await searchAnalyticsService.getABTestResults('test-123');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/ab-tests/test-123/results'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await searchAnalyticsService.getQueryAnalytics('week');
      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await searchAnalyticsService.getQueryAnalytics('week');
      expect(result).toEqual([]);
    });
  });
});
