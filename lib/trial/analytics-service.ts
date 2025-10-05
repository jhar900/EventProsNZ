import { createClient } from '@/lib/supabase/server';

export interface TrialAnalyticsData {
  userId: string;
  trialDay: number;
  featureUsage: {
    profile_completion: number;
    portfolio_uploads: number;
    search_usage: number;
    contact_usage: number;
  };
  platformEngagement: {
    login_frequency: number;
    feature_usage_score: number;
    time_spent: number;
  };
}

export interface TrialInsight {
  type: string;
  data: any;
  confidence: number;
}

export interface TrialAnalyticsSummary {
  totalDays: number;
  avgEngagement: number;
  conversionLikelihood: number;
  featureUsage: any;
  platformEngagement: any;
}

export class TrialAnalyticsService {
  private supabase = createClient();

  async trackTrialAnalytics(
    userId: string,
    trialDay: number,
    featureUsage: any,
    platformEngagement: any
  ): Promise<any> {
    try {
      // Ensure parameters are properly defined
      const safeFeatureUsage = featureUsage || {};
      const safePlatformEngagement = platformEngagement || {};

      // Calculate conversion likelihood based on engagement
      const loginFrequency = safePlatformEngagement.login_frequency || 0;
      const featureUsageScore = safePlatformEngagement.feature_usage_score || 0;
      const profileCompletion = safeFeatureUsage.profile_completion || 0;

      const conversionLikelihood = Math.min(
        loginFrequency * 0.3 +
          featureUsageScore * 0.4 +
          profileCompletion * 0.3,
        1.0
      );

      const { data: analytics, error } = await this.supabase
        .from('trial_analytics')
        .insert({
          user_id: userId,
          trial_day: trialDay,
          feature_usage: safeFeatureUsage,
          platform_engagement: safePlatformEngagement,
          conversion_likelihood: conversionLikelihood,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to track trial analytics: ${error.message}`);
      }

      // Generate insights based on analytics
      const insights = this.generateTrialInsights(analytics);

      // Store insights
      if (insights.length > 0) {
        const { error: insightsError } = await this.supabase
          .from('trial_insights')
          .insert(
            insights.map(insight => ({
              user_id: userId,
              insight_type: insight.type,
              insight_data: insight.data,
              confidence_score: insight.confidence,
            }))
          );

        if (insightsError) {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to store trial insights:', insightsError);
          }
          // Don't fail the request, just log the error
        }
      }

      return analytics;
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to track trial analytics:', error);
      }
      throw error;
    }
  }

  async getTrialAnalytics(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: analytics, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch trial analytics: ${error.message}`);
      }

      return analytics || [];
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get trial analytics:', error);
      }
      throw error;
    }
  }

  async getTrialInsights(userId: string): Promise<any[]> {
    try {
      const { data: insights, error } = await this.supabase
        .from('trial_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch trial insights: ${error.message}`);
      }

      return insights || [];
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get trial insights:', error);
      }
      throw error;
    }
  }

  async generateTrialInsights(analytics: any): Promise<TrialInsight[]> {
    const insights: TrialInsight[] = [];
    const {
      feature_usage = {},
      platform_engagement = {},
      conversion_likelihood = 0,
    } = analytics;

    // Profile completion insight
    if (feature_usage.profile_completion < 0.7) {
      insights.push({
        type: 'profile_optimization',
        data: {
          message: 'Complete your profile to increase visibility',
          actions: [
            'Add profile photo',
            'Complete bio section',
            'Add service categories',
            'Upload portfolio items',
          ],
          priority: 'high',
        },
        confidence: 0.9,
      });
    }

    // Feature usage insight
    if (platform_engagement.feature_usage_score < 0.5) {
      insights.push({
        type: 'feature_usage',
        data: {
          message: 'Explore more features to get the most from your trial',
          actions: [
            'Try the search functionality',
            'Upload portfolio items',
            'Complete your business profile',
            'Explore contractor matching',
          ],
          priority: 'medium',
        },
        confidence: 0.8,
      });
    }

    // Conversion likelihood insight
    if (conversion_likelihood > 0.7) {
      insights.push({
        type: 'conversion_opportunity',
        data: {
          message:
            "You're getting great value from the platform! Consider upgrading",
          tier_suggestion: 'showcase',
          benefits: [
            'Priority search visibility',
            'Enhanced profile features',
            'Advanced analytics',
            'Direct contact information',
          ],
          priority: 'high',
        },
        confidence: conversion_likelihood,
      });
    }

    return insights;
  }

  async getTrialAnalyticsSummary(
    userId: string
  ): Promise<TrialAnalyticsSummary> {
    try {
      const { data: summary, error } = await this.supabase.rpc(
        'get_trial_analytics_summary',
        {
          p_user_id: userId,
        }
      );

      if (error) {
        throw new Error(
          `Failed to fetch trial analytics summary: ${error.message}`
        );
      }

      return (
        summary || {
          totalDays: 0,
          avgEngagement: 0,
          conversionLikelihood: 0,
          featureUsage: {},
          platformEngagement: {},
        }
      );
    } catch (error) {
      console.error('Failed to get trial analytics summary:', error);
      throw error;
    }
  }

  async getTrialAnalyticsTrends(userId: string): Promise<any[]> {
    try {
      const { data: trends, error } = await this.supabase.rpc(
        'get_trial_analytics_trends',
        {
          p_user_id: userId,
        }
      );

      if (error) {
        throw new Error(
          `Failed to fetch trial analytics trends: ${error.message}`
        );
      }

      return trends || [];
    } catch (error) {
      console.error('Failed to get trial analytics trends:', error);
      throw error;
    }
  }
}
