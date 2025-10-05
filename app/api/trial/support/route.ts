import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for trial support
const trialSupportRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial support requests, please try again later',
};

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialSupportRateLimiter);
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

    // Get support resources
    const supportResources = [
      {
        id: 'getting-started',
        title: 'Getting Started Guide',
        description:
          'Learn how to set up your profile and start using the platform',
        type: 'guide',
        url: '/help/getting-started',
        priority: 'high',
      },
      {
        id: 'profile-optimization',
        title: 'Profile Optimization Tips',
        description:
          'Maximize your visibility with these profile optimization strategies',
        type: 'guide',
        url: '/help/profile-optimization',
        priority: 'high',
      },
      {
        id: 'portfolio-best-practices',
        title: 'Portfolio Best Practices',
        description:
          'Learn how to create an effective portfolio that attracts clients',
        type: 'guide',
        url: '/help/portfolio-best-practices',
        priority: 'medium',
      },
      {
        id: 'search-tips',
        title: 'Search and Discovery Tips',
        description: 'Find more opportunities with advanced search techniques',
        type: 'guide',
        url: '/help/search-tips',
        priority: 'medium',
      },
      {
        id: 'trial-features',
        title: 'Trial Features Overview',
        description: 'Explore all the features available during your trial',
        type: 'guide',
        url: '/help/trial-features',
        priority: 'high',
      },
    ];

    // Get contact information
    const contactInfo = {
      email: 'support@eventprosnz.com',
      phone: '+64 9 123 4567',
      hours: 'Monday - Friday, 9:00 AM - 5:00 PM NZST',
      response_time: 'Within 24 hours',
      priority_support: 'Available for Spotlight tier subscribers',
    };

    // Get user's trial status for personalized support
    const { data: trialConversion } = await supabase
      .from('trial_conversions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate trial days remaining
    let trialDaysRemaining = 14;
    if (subscription?.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date);
      const now = new Date();
      trialDaysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Add personalized support recommendations
    const personalizedRecommendations = [];

    if (trialDaysRemaining <= 3) {
      personalizedRecommendations.push({
        type: 'urgent',
        message: 'Your trial ends soon! Get help to maximize your success',
        actions: [
          'Schedule a demo call',
          'Get profile optimization help',
          'Learn about upgrade benefits',
        ],
      });
    }

    if (trialConversion?.conversion_likelihood < 0.3) {
      personalizedRecommendations.push({
        type: 'engagement',
        message: "We're here to help you get the most from your trial",
        actions: [
          'Get personalized onboarding',
          'Learn about platform features',
          'Get profile setup assistance',
        ],
      });
    }

    const response = NextResponse.json({
      support_resources: supportResources,
      contact_info: contactInfo,
      personalized_recommendations: personalizedRecommendations,
      trial_status: {
        days_remaining: trialDaysRemaining,
        conversion_likelihood: trialConversion?.conversion_likelihood || 0.5,
      },
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial support resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialSupportRateLimiter);
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
    const { user_id, subject, message, priority = 'normal' } = body;

    // Validate input
    if (!user_id || !subject || !message) {
      return NextResponse.json(
        { error: 'user_id, subject, and message are required' },
        { status: 400 }
      );
    }

    // Check if user can create support ticket for this user
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

    // Create support ticket
    const { data: supportTicket, error } = await supabase
      .from('trial_support_tickets')
      .insert({
        user_id,
        subject,
        message,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    const response = NextResponse.json({
      support_ticket: supportTicket,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
