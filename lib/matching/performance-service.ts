import { createClient } from '@/lib/supabase/server';
import { ContractorPerformanceResult } from '@/types/matching';

export class PerformanceService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Calculate performance score for a contractor
   */
  async calculatePerformanceScore(
    contractorId: string
  ): Promise<ContractorPerformanceResult> {
    try {
      // Get performance data
      const { data: performance, error } = await this.supabase
        .from('contractor_performance')
        .select('*')
        .eq('contractor_id', contractorId)
        .single();

      if (error || !performance) {
        // Return default performance if no data exists
        return this.getDefaultPerformance(contractorId);
      }

      const successRate =
        performance.total_projects > 0
          ? performance.successful_projects / performance.total_projects
          : 0;

      return {
        contractor_id: contractorId,
        response_time_hours: performance.response_time_hours || 24,
        reliability_score: performance.reliability_score || 0.5,
        quality_score: performance.quality_score || 0.5,
        communication_score: performance.communication_score || 0.5,
        overall_performance_score: performance.overall_performance_score || 0.5,
        total_projects: performance.total_projects,
        successful_projects: performance.successful_projects,
        success_rate: successRate,
      };
    } catch (error) {
      return this.getDefaultPerformance(contractorId);
    }
  }

  /**
   * Update performance metrics for a contractor
   */
  async updatePerformanceMetrics(
    contractorId: string,
    metrics: {
      response_time_hours?: number;
      reliability_score?: number;
      quality_score?: number;
      communication_score?: number;
      total_projects?: number;
      successful_projects?: number;
    }
  ): Promise<boolean> {
    try {
      // Calculate overall performance score
      const overallScore =
        (metrics.reliability_score || 0.5) * 0.3 +
        (metrics.quality_score || 0.5) * 0.3 +
        (metrics.communication_score || 0.5) * 0.2 +
        (metrics.total_projects > 0
          ? (metrics.successful_projects || 0) / metrics.total_projects
          : 0.5) *
          0.2;

      const { error } = await this.supabase
        .from('contractor_performance')
        .upsert({
          contractor_id: contractorId,
          response_time_hours: metrics.response_time_hours,
          reliability_score: metrics.reliability_score,
          quality_score: metrics.quality_score,
          communication_score: metrics.communication_score,
          overall_performance_score: overallScore,
          total_projects: metrics.total_projects,
          successful_projects: metrics.successful_projects,
        });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get performance trends for a contractor
   */
  async getPerformanceTrends(contractorId: string): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    metrics: {
      response_time: { current: number; previous: number; change: number };
      reliability: { current: number; previous: number; change: number };
      quality: { current: number; previous: number; change: number };
      communication: { current: number; previous: number; change: number };
    };
  }> {
    try {
      // This would typically query historical performance data
      // For now, return mock data
      const mockTrends = {
        trend: 'improving' as const,
        metrics: {
          response_time: { current: 4.2, previous: 6.1, change: -1.9 },
          reliability: { current: 0.85, previous: 0.78, change: 0.07 },
          quality: { current: 0.88, previous: 0.82, change: 0.06 },
          communication: { current: 0.9, previous: 0.85, change: 0.05 },
        },
      };

      return mockTrends;
    } catch (error) {
      throw new Error('Failed to get performance trends');
    }
  }

  /**
   * Get performance benchmarks for contractor type
   */
  async getPerformanceBenchmarks(contractorType: string): Promise<{
    average_response_time: number;
    average_reliability: number;
    average_quality: number;
    average_communication: number;
    top_percentile: {
      response_time: number;
      reliability: number;
      quality: number;
      communication: number;
    };
  }> {
    try {
      // Mock benchmark data
      const benchmarks = {
        average_response_time: 8.5,
        average_reliability: 0.75,
        average_quality: 0.78,
        average_communication: 0.8,
        top_percentile: {
          response_time: 2.0,
          reliability: 0.95,
          quality: 0.95,
          communication: 0.95,
        },
      };

      return benchmarks;
    } catch (error) {
      throw new Error('Failed to get performance benchmarks');
    }
  }

  /**
   * Calculate performance score from multiple factors
   */
  async calculatePerformanceScoreFromFactors(
    contractorId: string,
    factors: {
      response_time_hours: number;
      reliability_score: number;
      quality_score: number;
      communication_score: number;
      total_projects: number;
      successful_projects: number;
    }
  ): Promise<number> {
    try {
      const successRate =
        factors.total_projects > 0
          ? factors.successful_projects / factors.total_projects
          : 0.5;

      // Weighted performance calculation
      const performanceScore =
        factors.reliability_score * 0.3 +
        factors.quality_score * 0.3 +
        factors.communication_score * 0.2 +
        successRate * 0.2;

      return Math.min(1, Math.max(0, performanceScore));
    } catch (error) {
      return 0.5;
    }
  }

  private getDefaultPerformance(
    contractorId: string
  ): ContractorPerformanceResult {
    return {
      contractor_id: contractorId,
      response_time_hours: 24,
      reliability_score: 0.5,
      quality_score: 0.5,
      communication_score: 0.5,
      overall_performance_score: 0.5,
      total_projects: 0,
      successful_projects: 0,
      success_rate: 0,
    };
  }
}

export const performanceService = new PerformanceService();
