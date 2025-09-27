import { createClient } from '@/lib/supabase/client';

export interface SearchQueryData {
  query: string;
  search_count: number;
  unique_users: number;
  avg_results: number;
  date: string;
}

export interface FilterData {
  filter_type: string;
  filter_value: string;
  usage_count: number;
  unique_users: number;
  date: string;
}

export interface CTRMetrics {
  total_searches: number;
  total_clicks: number;
  click_through_rate: number;
  avg_click_position: number;
  date: string;
}

export interface TrendingTerm {
  query: string;
  search_count: number;
  unique_users: number;
  avg_results: number;
  date: string;
}

export interface BehaviorMetrics {
  avg_session_duration: number;
  avg_queries_per_session: number;
  avg_clicks_per_session: number;
  bounce_rate: number;
  return_visitor_rate: number;
  date: string;
}

export interface EngagementMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  avg_queries_per_user: number;
  avg_clicks_per_user: number;
  engagement_score: number;
  date: string;
}

export interface PerformanceMetrics {
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  total_queries: number;
  error_rate: number;
  throughput: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  test_type: string;
  control_config: Record<string, any>;
  variant_config: Record<string, any>;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export class SearchAnalyticsService {
  private get supabase() {
    return createClient();
  }

  async trackSearchQuery(data: {
    user_id: string;
    query: string;
    filters?: Record<string, any>;
    result_count: number;
    session_id?: string;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('search_queries')
        .insert([
          {
            user_id: data.user_id,
            query: data.query,
            filters: data.filters || {},
            result_count: data.result_count,
            session_id: data.session_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async trackSearchFilter(data: {
    user_id: string;
    filter_type: string;
    filter_value: string;
    search_session_id?: string;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('search_filters')
        .insert([
          {
            user_id: data.user_id,
            filter_type: data.filter_type,
            filter_value: data.filter_value,
            search_session_id: data.search_session_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async trackSearchClick(data: {
    user_id: string;
    contractor_id: string;
    search_query_id?: string;
    click_position: number;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('search_clicks')
        .insert([
          {
            user_id: data.user_id,
            contractor_id: data.contractor_id,
            search_query_id: data.search_query_id,
            click_position: data.click_position,
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async startSearchSession(user_id: string) {
    try {
      const { data: result, error } = await this.supabase
        .from('search_sessions')
        .insert([
          {
            user_id: user_id,
            session_start: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async endSearchSession(
    session_id: string,
    total_queries: number,
    total_clicks: number,
    session_start_time?: Date
  ) {
    try {
      // Calculate session duration properly
      const sessionEnd = new Date();
      const sessionStart = session_start_time || new Date(); // Fallback to current time if not provided
      const sessionDuration = Math.floor(
        (sessionEnd.getTime() - sessionStart.getTime()) / 1000
      );

      const { data: result, error } = await this.supabase
        .from('search_sessions')
        .update({
          session_end: sessionEnd.toISOString(),
          total_queries: total_queries,
          total_clicks: total_clicks,
          session_duration: sessionDuration,
        })
        .eq('id', session_id)
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async recordPerformanceMetric(data: {
    metric_type: string;
    metric_name: string;
    metric_value: number;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('performance_metrics')
        .insert([
          {
            metric_type: data.metric_type,
            metric_name: data.metric_name,
            metric_value: data.metric_value,
            metadata: data.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async createABTest(data: {
    name: string;
    description: string;
    test_type: string;
    control_config: Record<string, any>;
    variant_config: Record<string, any>;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('ab_tests')
        .insert([
          {
            name: data.name,
            description: data.description,
            test_type: data.test_type,
            control_config: data.control_config,
            variant_config: data.variant_config,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  async recordABTestResult(data: {
    test_id: string;
    user_id: string;
    variant: 'control' | 'variant';
    metric_name: string;
    metric_value: number;
  }) {
    try {
      const { data: result, error } = await this.supabase
        .from('ab_test_results')
        .insert([
          {
            test_id: data.test_id,
            user_id: data.user_id,
            variant: data.variant,
            metric_name: data.metric_name,
            metric_value: data.metric_value,
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  // Analytics data fetching methods
  async getQueryAnalytics(period: string = 'week', limit: number = 50) {
    try {
      const response = await fetch(
        `/api/analytics/search/queries?period=${period}&limit=${limit}`
      );
      const data = await response.json();
      return data.queries || [];
    } catch (error) {
      return [];
    }
  }

  async getFilterAnalytics(period: string = 'week') {
    try {
      const response = await fetch(
        `/api/analytics/search/filters?period=${period}`
      );
      const data = await response.json();
      return {
        filters: data.filters || [],
        patterns: data.usage_patterns || [],
      };
    } catch (error) {
      return { filters: [], patterns: [] };
    }
  }

  async getCTRAnalytics(period: string = 'week') {
    try {
      const response = await fetch(
        `/api/analytics/search/clickthrough?period=${period}`
      );
      const data = await response.json();
      return {
        metrics: data.ctr_metrics || {},
        analytics: data.click_analytics || [],
      };
    } catch (error) {
      return { metrics: {}, analytics: [] };
    }
  }

  async getTrendingData(period: string = 'week', limit: number = 20) {
    try {
      const response = await fetch(
        `/api/analytics/search/trending?period=${period}&limit=${limit}`
      );
      const data = await response.json();
      return {
        terms: data.trending_terms || [],
        services: data.trending_services || [],
      };
    } catch (error) {
      return { terms: [], services: [] };
    }
  }

  async getBehaviorAnalytics(
    period: string = 'week',
    userSegment: string = 'all'
  ) {
    try {
      const response = await fetch(
        `/api/analytics/search/behavior?period=${period}&user_segment=${userSegment}`
      );
      const data = await response.json();
      return {
        metrics: data.behavior_metrics || {},
        journeys: data.user_journeys || [],
      };
    } catch (error) {
      return { metrics: {}, journeys: [] };
    }
  }

  async getEngagementMetrics(period: string = 'week') {
    try {
      const response = await fetch(
        `/api/analytics/search/engagement?period=${period}`
      );
      const data = await response.json();
      return {
        metrics: data.engagement_metrics || {},
        activity: data.user_activity || [],
      };
    } catch (error) {
      return { metrics: {}, activity: [] };
    }
  }

  async getPerformanceMetrics(period: string = 'week') {
    try {
      const response = await fetch(
        `/api/analytics/performance/search?period=${period}`
      );
      const data = await response.json();
      return {
        metrics: data.performance_metrics || {},
        alerts: data.alerts || [],
      };
    } catch (error) {
      return { metrics: {}, alerts: [] };
    }
  }

  async getABTests() {
    try {
      const response = await fetch('/api/analytics/ab-tests');
      const data = await response.json();
      return data.tests || [];
    } catch (error) {
      return [];
    }
  }

  async getABTestResults(testId: string) {
    try {
      const response = await fetch(`/api/analytics/ab-tests/${testId}/results`);
      const data = await response.json();
      return data.test_results || null;
    } catch (error) {
      return null;
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
