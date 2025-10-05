import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration for trial notifications
const trialNotificationsRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many trial notification requests, please try again later',
};

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, trialNotificationsRateLimiter);
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

    // Get trial conversion data for notifications
    const { data: trialConversion, error: conversionError } = await supabase
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

    // Get subscription data
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch subscription: ${subscriptionError.message}`
      );
    }

    // Get trial emails for notification context
    const { data: trialEmails, error: emailsError } = await supabase
      .from('trial_emails')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (emailsError) {
      throw new Error(`Failed to fetch trial emails: ${emailsError.message}`);
    }

    // Get trial analytics for personalized notifications
    const { data: analytics, error: analyticsError } = await supabase
      .from('trial_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (analyticsError) {
      throw new Error(
        `Failed to fetch trial analytics: ${analyticsError.message}`
      );
    }

    // Generate personalized notifications
    const notifications = generateTrialNotifications(
      trialConversion,
      subscription,
      trialEmails || [],
      analytics || []
    );

    const response = NextResponse.json({
      notifications,
      trial_status: {
        conversion_status: trialConversion?.conversion_status || 'active',
        days_remaining: subscription?.trial_end_date
          ? Math.ceil(
              (new Date(subscription.trial_end_date).getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 14,
        tier: subscription?.tier || 'showcase',
      },
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial notifications' },
      { status: 500 }
    );
  }
}

function generateTrialNotifications(
  trialConversion: any,
  subscription: any,
  trialEmails: any[],
  analytics: any[]
) {
  const notifications = [];
  const now = new Date();

  // Trial status notifications
  if (subscription) {
    const trialEndDate = new Date(subscription.trial_end_date);
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0) {
      notifications.push({
        id: 'trial-expired',
        type: 'urgent',
        title: 'Your trial has expired',
        message:
          'Your trial period has ended. Upgrade to continue using the platform.',
        action: 'upgrade',
        priority: 'critical',
        created_at: now.toISOString(),
      });
    } else if (daysRemaining <= 1) {
      notifications.push({
        id: 'trial-ending-tomorrow',
        type: 'warning',
        title: 'Your trial ends tomorrow',
        message:
          'Your trial period ends in 24 hours. Consider upgrading to maintain access.',
        action: 'upgrade',
        priority: 'high',
        created_at: now.toISOString(),
      });
    } else if (daysRemaining <= 3) {
      notifications.push({
        id: 'trial-ending-soon',
        type: 'info',
        title: 'Your trial ends soon',
        message: `Your trial period ends in ${daysRemaining} days. Upgrade to continue using the platform.`,
        action: 'upgrade',
        priority: 'medium',
        created_at: now.toISOString(),
      });
    }
  }

  // Email notifications
  const pendingEmails = trialEmails.filter(
    email => email.email_status === 'pending'
  );
  if (pendingEmails.length > 0) {
    notifications.push({
      id: 'pending-emails',
      type: 'info',
      title: 'You have pending trial emails',
      message: `${pendingEmails.length} trial email(s) are scheduled to be sent.`,
      action: 'view-emails',
      priority: 'low',
      created_at: now.toISOString(),
    });
  }

  // Analytics-based notifications
  if (analytics.length > 0) {
    const latestAnalytics = analytics[0];
    const { conversion_likelihood, feature_usage, platform_engagement } =
      latestAnalytics;

    // High conversion likelihood
    if (conversion_likelihood > 0.8) {
      notifications.push({
        id: 'high-conversion-likelihood',
        type: 'success',
        title: 'Great progress on your trial!',
        message:
          "You're getting excellent value from the platform. Consider upgrading to maximize benefits.",
        action: 'upgrade',
        priority: 'medium',
        created_at: now.toISOString(),
      });
    }

    // Low engagement
    if (conversion_likelihood < 0.3) {
      notifications.push({
        id: 'low-engagement',
        type: 'warning',
        title: 'Get more from your trial',
        message:
          "You're not using many platform features. Explore more to get the most value.",
        action: 'get-help',
        priority: 'medium',
        created_at: now.toISOString(),
      });
    }

    // Profile completion
    if (feature_usage.profile_completion < 0.7) {
      notifications.push({
        id: 'profile-incomplete',
        type: 'info',
        title: 'Complete your profile',
        message:
          'Complete your profile to increase visibility and get more inquiries.',
        action: 'complete-profile',
        priority: 'medium',
        created_at: now.toISOString(),
      });
    }

    // Feature usage
    if (platform_engagement.feature_usage_score < 0.5) {
      notifications.push({
        id: 'low-feature-usage',
        type: 'info',
        title: 'Explore more features',
        message:
          'Try different platform features to get the most from your trial.',
        action: 'explore-features',
        priority: 'low',
        created_at: now.toISOString(),
      });
    }
  }

  // Conversion status notifications
  if (trialConversion) {
    if (trialConversion.conversion_status === 'converted') {
      notifications.push({
        id: 'conversion-success',
        type: 'success',
        title: 'Welcome to EventProsNZ!',
        message:
          'Thank you for upgrading! You now have access to all premium features.',
        action: 'explore-features',
        priority: 'low',
        created_at: trialConversion.conversion_date,
      });
    } else if (trialConversion.conversion_status === 'expired') {
      notifications.push({
        id: 'conversion-expired',
        type: 'info',
        title: 'Trial period ended',
        message:
          'Your trial period has ended. You can still use the free tier features.',
        action: 'upgrade',
        priority: 'medium',
        created_at: trialConversion.updated_at,
      });
    }
  }

  // Sort notifications by priority and creation date
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return notifications;
}
