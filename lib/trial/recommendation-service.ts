import { createClient } from '@/lib/supabase/server';

export interface TrialRecommendationData {
  userId: string;
  recommendationType: string;
  recommendationData: any;
  confidenceScore: number;
}

export interface RecommendationContext {
  trialDay: number;
  conversionLikelihood: number;
  featureUsage: any;
  platformEngagement: any;
  trialStatus: string;
  daysRemaining: number;
}

export class TrialRecommendationService {
  private supabase = createClient();

  async generateRecommendations(
    userId: string,
    trialData: any
  ): Promise<any[]> {
    try {
      // Get user's trial analytics for recommendation generation
      const { data: analytics, error: analyticsError } = await this.supabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (analyticsError) {
        throw new Error(
          `Failed to fetch trial analytics: ${analyticsError.message}`
        );
      }

      // Get user's trial conversion data
      const { data: conversion, error: conversionError } = await this.supabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (conversionError && conversionError.code !== 'PGRST116') {
        throw new Error(
          `Failed to fetch trial conversion: ${conversionError.message}`
        );
      }

      // Generate recommendations using the database function
      const { data: dbRecommendations, error: dbError } =
        await this.supabase.rpc('generate_trial_recommendations', {
          user_uuid: userId,
        });

      if (dbError) {
        console.error('Database recommendation generation failed:', dbError);
        // Continue with custom recommendations
      }

      // Generate custom recommendations based on trial data
      const customRecommendations = this.generateCustomRecommendations(
        analytics || [],
        trialData,
        conversion
      );

      // Combine database and custom recommendations
      const allRecommendations = [
        ...(dbRecommendations || []),
        ...customRecommendations,
      ];

      // Store new recommendations
      if (allRecommendations.length > 0) {
        const { error: insertError } = await this.supabase
          .from('trial_recommendations')
          .insert(
            allRecommendations.map(rec => ({
              user_id: userId,
              recommendation_type: rec.recommendation_type || rec.type,
              recommendation_data: rec.recommendation_data || rec.data,
              confidence_score: rec.confidence_score || rec.confidence,
            }))
          );

        if (insertError) {
          console.error('Failed to store some recommendations:', insertError);
          // Don't fail the request, just log the error
        }
      }

      return allRecommendations;
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  async getRecommendations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('trial_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch trial recommendations: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  async markRecommendationApplied(recommendationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('trial_recommendations')
        .update({ is_applied: true })
        .eq('id', recommendationId);

      if (error) {
        throw new Error(
          `Failed to mark recommendation as applied: ${error.message}`
        );
      }
    } catch (error) {
      console.error('Failed to mark recommendation as applied:', error);
      throw error;
    }
  }

  private generateCustomRecommendations(
    analytics: any[],
    trialData: any,
    conversion: any
  ): any[] {
    const recommendations: any[] = [];

    if (analytics.length === 0) {
      // Default recommendations for new users
      recommendations.push({
        type: 'profile_optimization',
        data: {
          message: 'Welcome to EventProsNZ! Start by completing your profile',
          actions: [
            'Add a professional profile photo',
            'Complete your bio section',
            'Add your service categories',
            'Upload portfolio items',
          ],
          priority: 'high',
          is_new_user: true,
        },
        confidence: 0.9,
      });

      return recommendations;
    }

    const latestAnalytics = analytics[0];
    const { feature_usage, platform_engagement, conversion_likelihood } =
      latestAnalytics;

    // Advanced profile optimization based on specific metrics
    if (feature_usage.profile_completion < 0.5) {
      recommendations.push({
        type: 'profile_optimization',
        data: {
          message:
            'Your profile is incomplete - this significantly impacts visibility',
          actions: [
            'Add a professional profile photo (increases visibility by 40%)',
            'Complete your bio section with keywords',
            'Add all relevant service categories',
            'Upload at least 3 portfolio items',
          ],
          priority: 'critical',
          completion_score: feature_usage.profile_completion,
          impact: 'high',
        },
        confidence: 0.95,
      });
    } else if (feature_usage.profile_completion < 0.8) {
      recommendations.push({
        type: 'profile_optimization',
        data: {
          message: 'Your profile is good but can be optimized further',
          actions: [
            'Add more detailed service descriptions',
            'Include client testimonials',
            'Add location and service areas',
            'Upload more portfolio items',
          ],
          priority: 'medium',
          completion_score: feature_usage.profile_completion,
          impact: 'medium',
        },
        confidence: 0.8,
      });
    }

    // Feature usage optimization
    if (platform_engagement.feature_usage_score < 0.3) {
      recommendations.push({
        type: 'feature_usage',
        data: {
          message:
            "You're not using many platform features - explore more to get value",
          actions: [
            'Try the advanced search filters',
            'Upload portfolio items with descriptions',
            'Complete your business profile',
            'Explore the contractor matching system',
            'Set up search alerts for relevant events',
          ],
          priority: 'high',
          usage_score: platform_engagement.feature_usage_score,
          potential_value: 'high',
        },
        confidence: 0.85,
      });
    }

    // Search optimization based on usage patterns
    if (platform_engagement.search_usage < 0.2) {
      recommendations.push({
        type: 'search_optimization',
        data: {
          message: 'Using search features can help you find more opportunities',
          actions: [
            'Try different search filters (location, budget, event type)',
            'Save favorite searches for quick access',
            'Set up search alerts for new opportunities',
            'Explore contractor profiles to understand the market',
          ],
          priority: 'medium',
          search_score: platform_engagement.search_usage,
          opportunity: 'new_events',
        },
        confidence: 0.7,
      });
    }

    // Portfolio optimization with specific guidance
    if (platform_engagement.portfolio_uploads < 1) {
      recommendations.push({
        type: 'portfolio_optimization',
        data: {
          message: 'Portfolio items are crucial for showcasing your work',
          actions: [
            'Upload high-quality photos of your best work',
            'Add detailed project descriptions',
            'Include client testimonials and reviews',
            'Showcase different types of services you offer',
            'Add before/after photos if applicable',
          ],
          priority: 'critical',
          portfolio_count: platform_engagement.portfolio_uploads,
          conversion_impact: 'high',
        },
        confidence: 0.9,
      });
    } else if (platform_engagement.portfolio_uploads < 3) {
      recommendations.push({
        type: 'portfolio_optimization',
        data: {
          message: 'Add more portfolio items to showcase your range',
          actions: [
            'Upload photos from different types of events',
            'Add video content if possible',
            'Include client testimonials',
            'Show seasonal or themed work',
          ],
          priority: 'medium',
          portfolio_count: platform_engagement.portfolio_uploads,
          conversion_impact: 'medium',
        },
        confidence: 0.75,
      });
    }

    // Conversion opportunity recommendations
    if (conversion_likelihood > 0.8) {
      recommendations.push({
        type: 'subscription_upgrade',
        data: {
          message:
            "You're getting excellent value! Consider upgrading to maximize benefits",
          tier_suggestion: 'showcase',
          benefits: [
            'Priority search visibility (appear at top of results)',
            'Enhanced profile features and customization',
            'Advanced analytics and insights',
            'Direct contact information visible to clients',
            'Featured contractor badge',
          ],
          priority: 'high',
          conversion_score: conversion_likelihood,
          roi_estimate: 'high',
        },
        confidence: conversion_likelihood,
      });
    } else if (conversion_likelihood > 0.6) {
      recommendations.push({
        type: 'subscription_upgrade',
        data: {
          message:
            "You're getting good value from the platform - consider upgrading",
          tier_suggestion: 'showcase',
          benefits: [
            'Priority search visibility',
            'Enhanced profile features',
            'Advanced analytics',
            'Direct contact information',
          ],
          priority: 'medium',
          conversion_score: conversion_likelihood,
          roi_estimate: 'medium',
        },
        confidence: conversion_likelihood,
      });
    }

    // Support and engagement recommendations
    if (conversion_likelihood < 0.3) {
      recommendations.push({
        type: 'support_contact',
        data: {
          message:
            "We're here to help you succeed! Contact support for personalized assistance",
          actions: [
            'Schedule a free demo call with our team',
            'Get personalized onboarding assistance',
            'Ask questions about specific features',
            'Get help with profile optimization',
            'Learn about best practices from successful contractors',
          ],
          priority: 'high',
          engagement_score: conversion_likelihood,
          support_type: 'personalized',
        },
        confidence: 0.8,
      });
    }

    // Time-based recommendations
    const trialDaysRemaining = conversion
      ? Math.ceil(
          (new Date(conversion.trial_end_date).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 14;

    if (trialDaysRemaining <= 3) {
      recommendations.push({
        type: 'trial_ending',
        data: {
          message:
            'Your trial ends soon - take action to continue your success',
          actions: [
            'Complete your profile if not done',
            'Upload portfolio items',
            'Contact support for help',
            'Consider upgrading to maintain access',
          ],
          priority: 'critical',
          days_remaining: trialDaysRemaining,
          urgency: 'high',
        },
        confidence: 0.95,
      });
    }

    return recommendations;
  }
}
