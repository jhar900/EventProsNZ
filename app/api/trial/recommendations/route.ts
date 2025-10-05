import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for trial recommendations
const trialRecommendationsRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial recommendations requests, please try again later',
};

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialRecommendationsRateLimiter);
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

    // Get trial recommendations
    const { data: recommendations, error } = await supabase
      .from('trial_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch trial recommendations: ${error.message}`
      );
    }

    const response = NextResponse.json({
      recommendations: recommendations || [],
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialRecommendationsRateLimiter);
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
    const { user_id, trial_data } = body;

    // Validate input
    if (!user_id || !trial_data) {
      return NextResponse.json(
        { error: 'user_id and trial_data are required' },
        { status: 400 }
      );
    }

    // Check if user can generate recommendations for this user
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

    // Get user's trial analytics for recommendation generation
    const { data: analytics, error: analyticsError } = await supabase
      .from('trial_analytics')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (analyticsError) {
      throw new Error(
        `Failed to fetch trial analytics: ${analyticsError.message}`
      );
    }

    // Generate recommendations based on analytics and trial data
    const recommendations = generateTrialRecommendations(
      analytics || [],
      trial_data
    );

    // Store recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('trial_recommendations')
        .insert(
          recommendations.map(rec => ({
            user_id,
            recommendation_type: rec.type,
            recommendation_data: rec.data,
            confidence_score: rec.confidence,
          }))
        );

      if (insertError) {
        throw new Error(
          `Failed to store recommendations: ${insertError.message}`
        );
      }
    }

    const response = NextResponse.json({
      recommendations,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate trial recommendations' },
      { status: 500 }
    );
  }
}

function generateTrialRecommendations(analytics: any[], trialData: any) {
  const recommendations = [];

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
      },
      confidence: 0.9,
    });

    return recommendations;
  }

  const latestAnalytics = analytics[0];
  const { feature_usage, platform_engagement, conversion_likelihood } =
    latestAnalytics;

  // Profile completion recommendations
  if (feature_usage.profile_completion < 0.7) {
    recommendations.push({
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

  // Feature usage recommendations
  if (platform_engagement.feature_usage_score < 0.5) {
    recommendations.push({
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

  // Search optimization recommendations
  if (platform_engagement.search_usage < 0.3) {
    recommendations.push({
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

  // Portfolio optimization recommendations
  if (platform_engagement.portfolio_uploads < 2) {
    recommendations.push({
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

  // Subscription upgrade recommendations
  if (conversion_likelihood > 0.7) {
    recommendations.push({
      type: 'subscription_upgrade',
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

  // Support contact recommendations
  if (conversion_likelihood < 0.3) {
    recommendations.push({
      type: 'support_contact',
      data: {
        message: 'Need help getting started? Contact our support team',
        actions: [
          'Schedule a demo call',
          'Get personalized onboarding',
          'Ask questions about features',
          'Get help with profile setup',
        ],
        priority: 'high',
        engagement_score: conversion_likelihood,
      },
      confidence: 0.8,
    });
  }

  return recommendations;
}
