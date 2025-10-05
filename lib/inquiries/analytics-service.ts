import { InquiryFilters } from '@/types/inquiries';

export interface InquiryAnalytics {
  total_inquiries: number;
  status_counts: {
    sent: number;
    viewed: number;
    responded: number;
    quoted: number;
  };
  response_time_avg: number;
  conversion_rate: number;
  popular_services: Array<{
    service: string;
    count: number;
  }>;
}

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  user_id?: string;
  contractor_id?: string;
  event_type?: string;
}

export class AnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inquiries/analytics';
  }

  // Get inquiry analytics
  async getInquiryAnalytics(
    filters?: AnalyticsFilters
  ): Promise<InquiryAnalytics> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch inquiry analytics');
    }

    return await response.json();
  }

  // Get response time analytics
  async getResponseTimeAnalytics(filters?: AnalyticsFilters): Promise<{
    average_response_time: number;
    median_response_time: number;
    fastest_response: number;
    slowest_response: number;
    response_time_distribution: Array<{
      range: string;
      count: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/response-time?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch response time analytics'
      );
    }

    return await response.json();
  }

  // Get conversion analytics
  async getConversionAnalytics(filters?: AnalyticsFilters): Promise<{
    overall_conversion_rate: number;
    conversion_by_status: Record<string, number>;
    conversion_trends: Array<{
      date: string;
      conversion_rate: number;
    }>;
    top_converting_contractors: Array<{
      contractor_id: string;
      contractor_name: string;
      conversion_rate: number;
      total_inquiries: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/conversion?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch conversion analytics'
      );
    }

    return await response.json();
  }

  // Get service analytics
  async getServiceAnalytics(filters?: AnalyticsFilters): Promise<{
    popular_services: Array<{
      service: string;
      count: number;
      percentage: number;
    }>;
    service_trends: Array<{
      service: string;
      trend: 'up' | 'down' | 'stable';
      change_percentage: number;
    }>;
    service_performance: Array<{
      service: string;
      average_response_time: number;
      conversion_rate: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/services?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch service analytics');
    }

    return await response.json();
  }

  // Get contractor analytics
  async getContractorAnalytics(filters?: AnalyticsFilters): Promise<{
    top_contractors: Array<{
      contractor_id: string;
      contractor_name: string;
      total_inquiries: number;
      response_rate: number;
      average_response_time: number;
    }>;
    contractor_performance: Array<{
      contractor_id: string;
      contractor_name: string;
      performance_score: number;
      trends: Array<{
        metric: string;
        value: number;
        change: number;
      }>;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/contractors?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch contractor analytics'
      );
    }

    return await response.json();
  }

  // Get time-based analytics
  async getTimeBasedAnalytics(filters?: AnalyticsFilters): Promise<{
    daily_trends: Array<{
      date: string;
      inquiries: number;
      responses: number;
      conversions: number;
    }>;
    weekly_trends: Array<{
      week: string;
      inquiries: number;
      responses: number;
      conversions: number;
    }>;
    monthly_trends: Array<{
      month: string;
      inquiries: number;
      responses: number;
      conversions: number;
    }>;
    seasonal_patterns: Array<{
      season: string;
      inquiries: number;
      peak_periods: string[];
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/time-based?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch time-based analytics'
      );
    }

    return await response.json();
  }

  // Get geographic analytics
  async getGeographicAnalytics(filters?: AnalyticsFilters): Promise<{
    location_distribution: Array<{
      location: string;
      count: number;
      percentage: number;
    }>;
    regional_performance: Array<{
      region: string;
      inquiries: number;
      response_rate: number;
      conversion_rate: number;
    }>;
    distance_analytics: Array<{
      distance_range: string;
      count: number;
      average_response_time: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/geographic?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch geographic analytics'
      );
    }

    return await response.json();
  }

  // Get budget analytics
  async getBudgetAnalytics(filters?: AnalyticsFilters): Promise<{
    budget_distribution: Array<{
      budget_range: string;
      count: number;
      average_response_time: number;
    }>;
    budget_vs_conversion: Array<{
      budget_range: string;
      conversion_rate: number;
    }>;
    price_sensitivity: {
      low_budget_conversion: number;
      high_budget_conversion: number;
      optimal_budget_range: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/budget?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch budget analytics');
    }

    return await response.json();
  }

  // Get performance metrics
  async getPerformanceMetrics(filters?: AnalyticsFilters): Promise<{
    kpis: {
      total_inquiries: number;
      response_rate: number;
      conversion_rate: number;
      average_response_time: number;
      customer_satisfaction: number;
    };
    trends: {
      inquiries_trend: 'up' | 'down' | 'stable';
      response_rate_trend: 'up' | 'down' | 'stable';
      conversion_trend: 'up' | 'down' | 'stable';
    };
    benchmarks: {
      industry_average_response_time: number;
      industry_average_conversion_rate: number;
      performance_vs_industry: {
        response_time: 'above' | 'below' | 'at';
        conversion_rate: 'above' | 'below' | 'at';
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/performance?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch performance metrics'
      );
    }

    return await response.json();
  }

  // Export analytics data
  async exportAnalytics(
    filters?: AnalyticsFilters,
    format: 'csv' | 'xlsx' | 'json' = 'csv'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/export?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export analytics data');
    }

    return await response.blob();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
