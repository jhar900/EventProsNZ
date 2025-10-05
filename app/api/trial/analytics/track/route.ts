import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for tracking trial analytics
const trackAnalyticsRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per window
  message: 'Too many trial analytics tracking requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trackAnalyticsRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, trial_day, feature_usage, platform_engagement } = body;

    // Validate input
    if (
      !user_id ||
      trial_day === undefined ||
      !feature_usage ||
      !platform_engagement
    ) {
      return NextResponse.json(
        {
          error:
            'user_id, trial_day, feature_usage, and platform_engagement are required',
        },
        { status: 400 }
      );
    }

    // Check if user can track analytics for this user
    if (user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Calculate conversion likelihood based on engagement
    const loginFrequency = platform_engagement.login_frequency || 0;
    const featureUsageScore = platform_engagement.feature_usage_score || 0;
    const profileCompletion = feature_usage.profile_completion || 0;
    const searchUsage = platform_engagement.search_usage || 0;
    const portfolioUploads = platform_engagement.portfolio_uploads || 0;

    // Weighted conversion likelihood calculation
    const conversionLikelihood = Math.min(
      loginFrequency * 0.2 +
        featureUsageScore * 0.3 +
        profileCompletion * 0.25 +
        searchUsage * 0.15 +
        portfolioUploads * 0.1,
      1.0
    );

    // Create trial analytics record
    const { data: analytics, error } = await supabase
      .from('trial_analytics')
      .insert({
        user_id,
        trial_day,
        feature_usage,
        platform_engagement,
        conversion_likelihood: conversionLikelihood,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track trial analytics: ${error.message}`);
    }

    // Generate and store insights
    const insights = generateTrialInsights(analytics);

    if (insights.length > 0) {
      const { error: insightsError } = await supabase
        .from('trial_insights')
        .insert(
          insights.map(insight => ({
            user_id,
            insight_type: insight.type,
            insight_data: insight.data,
            confidence_score: insight.confidence,
          }))
        );

      if (insightsError) {
        console.error('Failed to store trial insights:', insightsError);
        // Don't fail the request, just log the error
      }
    }

    const response = NextResponse.json({
      analytics,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track trial analytics' },
      { status: 500 }
    );
  }
}

function generateTrialInsights(analytics: any) {
  const insights = [];
  const { feature_usage, platform_engagement, conversion_likelihood } =
    analytics;

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
        completion_score: feature_usage.profile_completion,
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
        usage_score: platform_engagement.feature_usage_score,
      },
      confidence: 0.8,
    });
  }

  // Search usage insight
  if (platform_engagement.search_usage < 0.3) {
    insights.push({
      type: 'search_optimization',
      data: {
        message: 'Use the search feature to find relevant opportunities',
        actions: [
          'Try different search filters',
          'Save favorite searches',
          'Set up search alerts',
          'Explore contractor profiles',
        ],
        priority: 'medium',
        search_score: platform_engagement.search_usage,
      },
      confidence: 0.7,
    });
  }

  // Portfolio optimization insight
  if (platform_engagement.portfolio_uploads < 2) {
    insights.push({
      type: 'portfolio_optimization',
      data: {
        message: 'Upload portfolio items to showcase your work',
        actions: [
          'Upload high-quality photos',
          'Add project descriptions',
          'Include client testimonials',
          'Showcase different service types',
        ],
        priority: 'high',
        portfolio_count: platform_engagement.portfolio_uploads,
      },
      confidence: 0.85,
    });
  }

  // Conversion opportunity insight
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
        conversion_score: conversion_likelihood,
      },
      confidence: conversion_likelihood,
    });
  }

  // Low engagement insight
  if (conversion_likelihood < 0.3) {
    insights.push({
      type: 'engagement_improvement',
      data: {
        message: 'Increase your engagement to get more value from the platform',
        actions: [
          'Log in regularly',
          'Complete your profile',
          'Upload portfolio items',
          'Use search features',
          'Contact support for help',
        ],
        priority: 'high',
        engagement_score: conversion_likelihood,
      },
      confidence: 0.8,
    });
  }

  return insights;
}
