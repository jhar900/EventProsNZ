import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock fetch globally with proper response structure
global.fetch = jest.fn();

// Mock the search analytics service
const mockSearchAnalyticsService = {
  getQueryAnalytics: jest.fn(),
  getFilterAnalytics: jest.fn(),
  getCTRAnalytics: jest.fn(),
  getTrendingData: jest.fn(),
  getBehaviorAnalytics: jest.fn(),
  getEngagementMetrics: jest.fn(),
  getPerformanceMetrics: jest.fn(),
  getABTests: jest.fn(),
  trackSearchQuery: jest.fn(),
  trackSearchFilter: jest.fn(),
  trackSearchClick: jest.fn(),
  startSearchSession: jest.fn(),
  endSearchSession: jest.fn(),
  recordPerformanceMetric: jest.fn(),
  createABTest: jest.fn(),
  recordABTestResult: jest.fn(),
};

// Mock Supabase client with proper chaining
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

// Mock the entire search analytics module
jest.mock('@/lib/analytics/search-analytics', () => ({
  searchAnalyticsService: mockSearchAnalyticsService,
}));

// Import the hook after mocking
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';

describe('useSearchAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful responses for service methods
    mockSearchAnalyticsService.getQueryAnalytics.mockResolvedValue([
      { query: 'photographer', search_count: 10, unique_users: 5 },
    ]);
    mockSearchAnalyticsService.getFilterAnalytics.mockResolvedValue({
      filters: [{ filter_type: 'location', usage_count: 5 }],
      patterns: [{ filter_type: 'service_type', combination_count: 3 }],
    });
    mockSearchAnalyticsService.getCTRAnalytics.mockResolvedValue({
      metrics: { click_through_rate: 0.12 },
      analytics: [{ query: 'photographer', click_count: 2 }],
    });
    mockSearchAnalyticsService.getTrendingData.mockResolvedValue({
      terms: [{ query: 'photographer', search_count: 20 }],
      services: [{ service_category: 'photography', search_count: 15 }],
    });
    mockSearchAnalyticsService.getBehaviorAnalytics.mockResolvedValue({
      metrics: { avg_session_duration: 120 },
      journeys: [{ user_id: 'user-1', journey_type: 'high_engagement' }],
    });
    mockSearchAnalyticsService.getEngagementMetrics.mockResolvedValue({
      metrics: { daily_active_users: 100 },
      activity: [{ user_id: 'user-1', activity_score: 15 }],
    });
    mockSearchAnalyticsService.getPerformanceMetrics.mockResolvedValue({
      metrics: { avg_response_time: 200 },
      alerts: [{ alert_type: 'slow_response', severity: 'warning' }],
    });
    mockSearchAnalyticsService.getABTests.mockResolvedValue([
      { id: 'test-1', name: 'Test 1', status: 'active' },
    ]);
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useSearchAnalytics());

    // Initially loading should be true as the hook starts fetching data
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.queryAnalytics).toEqual([]);
    expect(result.current.filterAnalytics).toEqual({
      filters: [],
      patterns: [],
    });
    expect(result.current.ctrMetrics).toEqual({
      metrics: {} as any,
      analytics: [],
    });
    expect(result.current.trendingData).toEqual({ terms: [], services: [] });
    expect(result.current.behaviorMetrics).toEqual({
      metrics: {} as any,
      journeys: [],
    });
    expect(result.current.engagementMetrics).toEqual({
      metrics: {} as any,
      activity: [],
    });
    expect(result.current.performanceMetrics).toEqual({
      metrics: {} as any,
      alerts: [],
    });
    expect(result.current.abTests).toEqual([]);

    // Wait for initial fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // After fetch completes, loading should be false
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide tracking methods', () => {
    const { result } = renderHook(() => useSearchAnalytics());

    expect(typeof result.current.trackSearchQuery).toBe('function');
    expect(typeof result.current.trackSearchFilter).toBe('function');
    expect(typeof result.current.trackSearchClick).toBe('function');
    expect(typeof result.current.startSearchSession).toBe('function');
    expect(typeof result.current.endSearchSession).toBe('function');
    expect(typeof result.current.recordPerformanceMetric).toBe('function');
    expect(typeof result.current.createABTest).toBe('function');
    expect(typeof result.current.recordABTestResult).toBe('function');
  });

  it('should track search query', async () => {
    const { result } = renderHook(() => useSearchAnalytics());

    const mockData = {
      user_id: 'user-123',
      query: 'photographer',
      result_count: 15,
    };

    const mockResult = { id: 'query-123' };
    mockSearchAnalyticsService.trackSearchQuery.mockResolvedValue(mockResult);

    let trackResult;
    await act(async () => {
      trackResult = await result.current.trackSearchQuery(mockData);
    });

    expect(mockSearchAnalyticsService.trackSearchQuery).toHaveBeenCalledWith(
      mockData
    );
    expect(trackResult).toEqual(mockResult);
  });

  it('should track search filter', async () => {
    const { result } = renderHook(() => useSearchAnalytics());

    const mockData = {
      user_id: 'user-123',
      filter_type: 'location',
      filter_value: 'Auckland',
    };

    const mockResult = { id: 'filter-123' };
    mockSearchAnalyticsService.trackSearchFilter.mockResolvedValue(mockResult);

    let trackResult;
    await act(async () => {
      trackResult = await result.current.trackSearchFilter(mockData);
    });

    expect(mockSearchAnalyticsService.trackSearchFilter).toHaveBeenCalledWith(
      mockData
    );
    expect(trackResult).toEqual(mockResult);
  });

  it('should track search click', async () => {
    const { result } = renderHook(() => useSearchAnalytics());

    const mockData = {
      user_id: 'user-123',
      contractor_id: 'contractor-456',
      click_position: 2,
    };

    const mockResult = { id: 'click-123' };
    mockSearchAnalyticsService.trackSearchClick.mockResolvedValue(mockResult);

    let trackResult;
    await act(async () => {
      trackResult = await result.current.trackSearchClick(mockData);
    });

    expect(mockSearchAnalyticsService.trackSearchClick).toHaveBeenCalledWith(
      mockData
    );
    expect(trackResult).toEqual(mockResult);
  });

  it('should create A/B test and refresh list', async () => {
    const { result } = renderHook(() => useSearchAnalytics());

    const mockData = {
      name: 'Test',
      description: 'Test description',
      test_type: 'search_algorithm',
      control_config: {},
      variant_config: {},
    };

    const mockResult = { id: 'test-123' };
    mockSearchAnalyticsService.createABTest.mockResolvedValue(mockResult);

    let createResult;
    await act(async () => {
      createResult = await result.current.createABTest(mockData);
    });

    expect(mockSearchAnalyticsService.createABTest).toHaveBeenCalledWith(
      mockData
    );
    expect(createResult).toEqual(mockResult);
    // Verify that fetchABTests was called to refresh the list
    expect(mockSearchAnalyticsService.getABTests).toHaveBeenCalled();
  });

  it('should provide refresh method', () => {
    const { result } = renderHook(() => useSearchAnalytics());

    expect(typeof result.current.refresh).toBe('function');
  });

  it('should handle errors gracefully', async () => {
    // Mock service to return an error
    mockSearchAnalyticsService.getQueryAnalytics.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useSearchAnalytics());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.error).toBe('Failed to fetch query analytics');
  });
});
