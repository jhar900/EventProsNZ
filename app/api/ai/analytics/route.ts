import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiCache } from '@/lib/ai/cache';
import { z } from 'zod';

// Validation schemas
const AnalyticsRequestSchema = z.object({
  time_period: z
    .enum(['day', 'week', 'month', 'quarter', 'year'])
    .default('month'),
  event_type: z.string().optional(),
  user_id: z.string().uuid().optional(),
  metric_types: z.array(z.string()).optional(),
});

const AnalyticsMetricSchema = z.object({
  metric_name: z.string(),
  value: z.number(),
  change_percentage: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  timestamp: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('time_period') || 'month';
    const eventType = searchParams.get('event_type');
    const userId = searchParams.get('user_id');
    const metricTypes = searchParams.get('metric_types')?.split(',');

    // Check cache first
    const cacheKey = aiCache.generateKey(
      'analytics',
      timePeriod,
      eventType,
      userId,
      metricTypes
    );
    const cachedAnalytics = aiCache.get(cacheKey);

    if (cachedAnalytics) {
      return NextResponse.json({
        ...cachedAnalytics,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate request parameters
    const validationResult = AnalyticsRequestSchema.safeParse({
      time_period: timePeriod,
      event_type: eventType,
      user_id: userId,
      metric_types: metricTypes,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timePeriod) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get recommendation analytics
    const recommendationAnalytics = await getRecommendationAnalytics(
      supabase,
      startDate,
      endDate,
      eventType,
      userId
    );

    // Get user engagement analytics
    const engagementAnalytics = await getEngagementAnalytics(
      supabase,
      startDate,
      endDate,
      eventType,
      userId
    );

    // Get learning analytics
    const learningAnalytics = await getLearningAnalytics(
      supabase,
      startDate,
      endDate,
      eventType,
      userId
    );

    // Get A/B testing analytics
    const abTestingAnalytics = await getABTestingAnalytics(
      supabase,
      startDate,
      endDate,
      eventType,
      userId
    );

    // Get performance analytics
    const performanceAnalytics = await getPerformanceAnalytics(
      supabase,
      startDate,
      endDate,
      eventType,
      userId
    );

    // Combine all analytics
    const analytics = {
      recommendation_analytics: recommendationAnalytics,
      engagement_analytics: engagementAnalytics,
      learning_analytics: learningAnalytics,
      ab_testing_analytics: abTestingAnalytics,
      performance_analytics: performanceAnalytics,
      metadata: {
        time_period: timePeriod,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        event_type: eventType,
        user_id: userId,
        generated_at: new Date().toISOString(),
      },
    };

    // Cache the analytics data
    aiCache.setWithType(cacheKey, analytics, 'analytics');

    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get recommendation analytics
async function getRecommendationAnalytics(
  supabase: any,
  startDate: Date,
  endDate: Date,
  eventType?: string,
  userId?: string
) {
  try {
    // Get recommendation requests
    let query = supabase
      .from('recommendation_requests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      return { error: 'Failed to fetch recommendation data' };
    }

    // Get recommendation feedback
    let feedbackQuery = supabase
      .from('recommendation_feedback')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (userId) {
      feedbackQuery = feedbackQuery.eq('user_id', userId);
    }

    const { data: feedback, error: feedbackError } = await feedbackQuery;

    if (feedbackError) {
      }

    // Calculate metrics
    const totalRequests = requests?.length || 0;
    const totalFeedback = feedback?.length || 0;
    const averageRating =
      feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0;

    const eventTypeBreakdown =
      requests?.reduce(
        (acc, req) => {
          acc[req.event_type] = (acc[req.event_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const feedbackBreakdown =
      feedback?.reduce(
        (acc, fb) => {
          acc[fb.feedback_type] = (acc[fb.feedback_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return {
      total_requests: totalRequests,
      total_feedback: totalFeedback,
      feedback_rate:
        totalRequests > 0 ? (totalFeedback / totalRequests) * 100 : 0,
      average_rating: Math.round(averageRating * 100) / 100,
      event_type_breakdown: eventTypeBreakdown,
      feedback_breakdown: feedbackBreakdown,
      top_event_types: Object.entries(eventTypeBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ event_type: type, count })),
    };
  } catch (error) {
    return { error: 'Failed to calculate recommendation analytics' };
  }
}

// Helper function to get engagement analytics
async function getEngagementAnalytics(
  supabase: any,
  startDate: Date,
  endDate: Date,
  eventType?: string,
  userId?: string
) {
  try {
    // Get user interactions with recommendations
    let query = supabase
      .from('recommendation_interactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: interactions, error } = await query;

    if (error) {
      return { error: 'Failed to fetch engagement data' };
    }

    const totalInteractions = interactions?.length || 0;
    const clickThroughRate =
      interactions && interactions.length > 0
        ? (interactions.filter(i => i.action === 'click').length /
            interactions.length) *
          100
        : 0;

    const conversionRate =
      interactions && interactions.length > 0
        ? (interactions.filter(i => i.action === 'convert').length /
            interactions.length) *
          100
        : 0;

    const actionBreakdown =
      interactions?.reduce(
        (acc, interaction) => {
          acc[interaction.action] = (acc[interaction.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return {
      total_interactions: totalInteractions,
      click_through_rate: Math.round(clickThroughRate * 100) / 100,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      action_breakdown: actionBreakdown,
      average_session_duration: 0, // Would need session tracking
      bounce_rate: 0, // Would need session tracking
    };
  } catch (error) {
    return { error: 'Failed to calculate engagement analytics' };
  }
}

// Helper function to get learning analytics
async function getLearningAnalytics(
  supabase: any,
  startDate: Date,
  endDate: Date,
  eventType?: string,
  userId?: string
) {
  try {
    // Get learning data
    let query = supabase
      .from('ai_learning_data')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: learningData, error } = await query;

    if (error) {
      return { error: 'Failed to fetch learning data' };
    }

    // Get service patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('service_patterns')
      .select('*')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (patternsError) {
      }

    const totalLearningEvents = learningData?.length || 0;
    const averageSuccessRate =
      learningData && learningData.length > 0
        ? learningData.reduce(
            (sum, ld) => sum + (ld.success_metrics.overall_rating >= 4 ? 1 : 0),
            0
          ) / learningData.length
        : 0;

    const patternsCount = patterns?.length || 0;
    const highConfidencePatterns =
      patterns?.filter(p => p.confidence_level > 0.8).length || 0;

    return {
      total_learning_events: totalLearningEvents,
      average_success_rate: Math.round(averageSuccessRate * 100) / 100,
      total_patterns: patternsCount,
      high_confidence_patterns: highConfidencePatterns,
      pattern_confidence_rate:
        patternsCount > 0 ? (highConfidencePatterns / patternsCount) * 100 : 0,
      learning_velocity: totalLearningEvents / 30, // Events per day
    };
  } catch (error) {
    return { error: 'Failed to calculate learning analytics' };
  }
}

// Helper function to get A/B testing analytics
async function getABTestingAnalytics(
  supabase: any,
  startDate: Date,
  endDate: Date,
  eventType?: string,
  userId?: string
) {
  try {
    // Get A/B test results
    let query = supabase
      .from('ai_ab_test_results')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: testResults, error } = await query;

    if (error) {
      return { error: 'Failed to fetch A/B testing data' };
    }

    const totalTests = testResults?.length || 0;
    const variantAResults = testResults?.filter(r => r.variant === 'A') || [];
    const variantBResults = testResults?.filter(r => r.variant === 'B') || [];

    const variantASuccessRate =
      variantAResults.length > 0
        ? (variantAResults.filter(r => r.result_data.conversion_rate > 0)
            .length /
            variantAResults.length) *
          100
        : 0;

    const variantBSuccessRate =
      variantBResults.length > 0
        ? (variantBResults.filter(r => r.result_data.conversion_rate > 0)
            .length /
            variantBResults.length) *
          100
        : 0;

    return {
      total_tests: totalTests,
      variant_a_participants: variantAResults.length,
      variant_b_participants: variantBResults.length,
      variant_a_success_rate: Math.round(variantASuccessRate * 100) / 100,
      variant_b_success_rate: Math.round(variantBSuccessRate * 100) / 100,
      winning_variant:
        variantASuccessRate > variantBSuccessRate
          ? 'A'
          : variantBSuccessRate > variantASuccessRate
            ? 'B'
            : 'tie',
      statistical_significance: totalTests >= 20, // Simple threshold
    };
  } catch (error) {
    return { error: 'Failed to calculate A/B testing analytics' };
  }
}

// Helper function to get performance analytics
async function getPerformanceAnalytics(
  supabase: any,
  startDate: Date,
  endDate: Date,
  eventType?: string,
  userId?: string
) {
  try {
    // Get API performance data (would need to be stored)
    const { data: performanceData, error } = await supabase
      .from('api_performance_logs')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .like('endpoint', '%ai%');

    if (error) {
      }

    const totalRequests = performanceData?.length || 0;
    const averageResponseTime =
      performanceData && performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + p.response_time, 0) /
          performanceData.length
        : 0;

    const errorRate =
      performanceData && performanceData.length > 0
        ? (performanceData.filter(p => p.status_code >= 400).length /
            performanceData.length) *
          100
        : 0;

    return {
      total_api_requests: totalRequests,
      average_response_time: Math.round(averageResponseTime * 100) / 100,
      error_rate: Math.round(errorRate * 100) / 100,
      uptime_percentage: 100 - errorRate,
      cache_hit_rate: 0, // Would need cache metrics
      throughput: totalRequests / 30, // Requests per day
    };
  } catch (error) {
    return { error: 'Failed to calculate performance analytics' };
  }
}
