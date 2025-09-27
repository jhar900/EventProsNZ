import { useState, useEffect, useCallback } from 'react';
import {
  searchAnalyticsService,
  type SearchQueryData,
  type FilterData,
  type CTRMetrics,
  type TrendingTerm,
  type BehaviorMetrics,
  type EngagementMetrics,
  type PerformanceMetrics,
  type ABTest,
} from '@/lib/analytics/search-analytics';

export interface UseSearchAnalyticsOptions {
  period?: string;
  userSegment?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSearchAnalytics(options: UseSearchAnalyticsOptions = {}) {
  const {
    period = 'week',
    userSegment = 'all',
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query Analytics
  const [queryAnalytics, setQueryAnalytics] = useState<SearchQueryData[]>([]);
  const [filterAnalytics, setFilterAnalytics] = useState<{
    filters: FilterData[];
    patterns: any[];
  }>({ filters: [], patterns: [] });
  const [ctrMetrics, setCtrMetrics] = useState<{
    metrics: CTRMetrics;
    analytics: any[];
  }>({ metrics: {} as CTRMetrics, analytics: [] });
  const [trendingData, setTrendingData] = useState<{
    terms: TrendingTerm[];
    services: any[];
  }>({ terms: [], services: [] });
  const [behaviorMetrics, setBehaviorMetrics] = useState<{
    metrics: BehaviorMetrics;
    journeys: any[];
  }>({ metrics: {} as BehaviorMetrics, journeys: [] });
  const [engagementMetrics, setEngagementMetrics] = useState<{
    metrics: EngagementMetrics;
    activity: any[];
  }>({ metrics: {} as EngagementMetrics, activity: [] });
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    metrics: PerformanceMetrics;
    alerts: any[];
  }>({ metrics: {} as PerformanceMetrics, alerts: [] });
  const [abTests, setAbTests] = useState<ABTest[]>([]);

  const fetchQueryAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getQueryAnalytics(
        period,
        limit
      );
      setQueryAnalytics(data);
    } catch (err) {
      setError('Failed to fetch query analytics');
      } finally {
      setIsLoading(false);
    }
  }, [period, limit]);

  const fetchFilterAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getFilterAnalytics(period);
      setFilterAnalytics(data);
    } catch (err) {
      setError('Failed to fetch filter analytics');
      } finally {
      setIsLoading(false);
    }
  }, [period]);

  const fetchCTRAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getCTRAnalytics(period);
      setCtrMetrics(data);
    } catch (err) {
      setError('Failed to fetch CTR analytics');
      } finally {
      setIsLoading(false);
    }
  }, [period]);

  const fetchTrendingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getTrendingData(period, limit);
      setTrendingData(data);
    } catch (err) {
      setError('Failed to fetch trending data');
      } finally {
      setIsLoading(false);
    }
  }, [period, limit]);

  const fetchBehaviorAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getBehaviorAnalytics(
        period,
        userSegment
      );
      setBehaviorMetrics(data);
    } catch (err) {
      setError('Failed to fetch behavior analytics');
      } finally {
      setIsLoading(false);
    }
  }, [period, userSegment]);

  const fetchEngagementMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getEngagementMetrics(period);
      setEngagementMetrics(data);
    } catch (err) {
      setError('Failed to fetch engagement metrics');
      } finally {
      setIsLoading(false);
    }
  }, [period]);

  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getPerformanceMetrics(period);
      setPerformanceMetrics(data);
    } catch (err) {
      setError('Failed to fetch performance metrics');
      } finally {
      setIsLoading(false);
    }
  }, [period]);

  const fetchABTests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAnalyticsService.getABTests();
      setAbTests(data);
    } catch (err) {
      setError('Failed to fetch A/B tests');
      } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllAnalytics = useCallback(async () => {
    await Promise.all([
      fetchQueryAnalytics(),
      fetchFilterAnalytics(),
      fetchCTRAnalytics(),
      fetchTrendingData(),
      fetchBehaviorAnalytics(),
      fetchEngagementMetrics(),
      fetchPerformanceMetrics(),
      fetchABTests(),
    ]);
  }, [
    fetchQueryAnalytics,
    fetchFilterAnalytics,
    fetchCTRAnalytics,
    fetchTrendingData,
    fetchBehaviorAnalytics,
    fetchEngagementMetrics,
    fetchPerformanceMetrics,
    fetchABTests,
  ]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchAllAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Tracking methods
  const trackSearchQuery = useCallback(
    async (data: {
      user_id: string;
      query: string;
      filters?: Record<string, any>;
      result_count: number;
      session_id?: string;
    }) => {
      try {
        return await searchAnalyticsService.trackSearchQuery(data);
      } catch (err) {
        return null;
      }
    },
    []
  );

  const trackSearchFilter = useCallback(
    async (data: {
      user_id: string;
      filter_type: string;
      filter_value: string;
      search_session_id?: string;
    }) => {
      try {
        return await searchAnalyticsService.trackSearchFilter(data);
      } catch (err) {
        return null;
      }
    },
    []
  );

  const trackSearchClick = useCallback(
    async (data: {
      user_id: string;
      contractor_id: string;
      search_query_id?: string;
      click_position: number;
    }) => {
      try {
        return await searchAnalyticsService.trackSearchClick(data);
      } catch (err) {
        return null;
      }
    },
    []
  );

  const startSearchSession = useCallback(async (user_id: string) => {
    try {
      return await searchAnalyticsService.startSearchSession(user_id);
    } catch (err) {
      return null;
    }
  }, []);

  const endSearchSession = useCallback(
    async (session_id: string, total_queries: number, total_clicks: number) => {
      try {
        return await searchAnalyticsService.endSearchSession(
          session_id,
          total_queries,
          total_clicks
        );
      } catch (err) {
        return null;
      }
    },
    []
  );

  const recordPerformanceMetric = useCallback(
    async (data: {
      metric_type: string;
      metric_name: string;
      metric_value: number;
      metadata?: Record<string, any>;
    }) => {
      try {
        return await searchAnalyticsService.recordPerformanceMetric(data);
      } catch (err) {
        return null;
      }
    },
    []
  );

  const createABTest = useCallback(
    async (data: {
      name: string;
      description: string;
      test_type: string;
      control_config: Record<string, any>;
      variant_config: Record<string, any>;
    }) => {
      try {
        const result = await searchAnalyticsService.createABTest(data);
        if (result) {
          await fetchABTests(); // Refresh the list
        }
        return result;
      } catch (err) {
        return null;
      }
    },
    [fetchABTests]
  );

  const recordABTestResult = useCallback(
    async (data: {
      test_id: string;
      user_id: string;
      variant: 'control' | 'variant';
      metric_name: string;
      metric_value: number;
    }) => {
      try {
        return await searchAnalyticsService.recordABTestResult(data);
      } catch (err) {
        return null;
      }
    },
    []
  );

  return {
    // State
    isLoading,
    error,
    queryAnalytics,
    filterAnalytics,
    ctrMetrics,
    trendingData,
    behaviorMetrics,
    engagementMetrics,
    performanceMetrics,
    abTests,

    // Fetch methods
    fetchQueryAnalytics,
    fetchFilterAnalytics,
    fetchCTRAnalytics,
    fetchTrendingData,
    fetchBehaviorAnalytics,
    fetchEngagementMetrics,
    fetchPerformanceMetrics,
    fetchABTests,
    fetchAllAnalytics,

    // Tracking methods
    trackSearchQuery,
    trackSearchFilter,
    trackSearchClick,
    startSearchSession,
    endSearchSession,
    recordPerformanceMetric,
    createABTest,
    recordABTestResult,

    // Utility methods
    refresh: fetchAllAnalytics,
  };
}
