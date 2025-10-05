import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';
import { withCSRFProtection } from '@/lib/security/csrf-protection';
import { DataSanitizer } from '@/lib/security/data-sanitizer';
import { AuditLogger } from '@/lib/security/audit-logger';

// Rate limiting configuration for trial analytics
const trialAnalyticsRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial analytics requests, please try again later',
};

export const GET = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialAnalyticsRateLimiter);
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Check if requesting user's own data or admin
    if (userId !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build query for analytics
    let query = supabase
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

    // Get insights
    const { data: insights, error: insightsError } = await supabase
      .from('trial_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (insightsError) {
      throw new Error(
        `Failed to fetch trial insights: ${insightsError.message}`
      );
    }

    const response = NextResponse.json({
      analytics: analytics || [],
      insights: insights || [],
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial analytics' },
      { status: 500 }
    );
  }
});

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialAnalyticsRateLimiter);
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

    const conversionLikelihood = Math.min(
      loginFrequency * 0.3 + featureUsageScore * 0.4 + profileCompletion * 0.3,
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

    // Generate insights based on analytics
    const insights = generateTrialInsights(analytics);

    // Store insights
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
});

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
