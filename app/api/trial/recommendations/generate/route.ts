import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for generating trial recommendations
const generateRecommendationsRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message:
    'Too many recommendation generation requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(
      request,
      generateRecommendationsRateLimiter
    );
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
      .limit(10);

    if (analyticsError) {
      throw new Error(
        `Failed to fetch trial analytics: ${analyticsError.message}`
      );
    }

    // Get user's trial conversion data
    const { data: conversion, error: conversionError } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conversionError && conversionError.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch trial conversion: ${conversionError.message}`
      );
    }

    // Generate recommendations using the database function
    const { data: dbRecommendations, error: dbError } = await supabase.rpc(
      'generate_trial_recommendations',
      { user_uuid: user_id }
    );

    if (dbError) {
      throw new Error(`Failed to generate recommendations: ${dbError.message}`);
    }

    // Also generate custom recommendations based on trial data
    const customRecommendations = generateCustomRecommendations(
      analytics || [],
      trial_data,
      conversion
    );

    // Combine database and custom recommendations
    const allRecommendations = [
      ...(dbRecommendations || []),
      ...customRecommendations,
    ];

    // Store new recommendations
    if (allRecommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('trial_recommendations')
        .insert(
          allRecommendations.map(rec => ({
            user_id,
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

    const response = NextResponse.json({
      recommendations: allRecommendations,
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

function generateCustomRecommendations(
  analytics: any[],
  trialData: any,
  conversion: any
) {
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
        (new Date(conversion.trial_end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 14;

  if (trialDaysRemaining <= 3) {
    recommendations.push({
      type: 'trial_ending',
      data: {
        message: 'Your trial ends soon - take action to continue your success',
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
