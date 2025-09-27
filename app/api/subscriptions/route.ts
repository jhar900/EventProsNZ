import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/subscriptions/subscription-service';
import { validateSubscriptionCreateData } from '@/lib/subscriptions/validation';
import { rateLimit, subscriptionRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, subscriptionRateLimiter);
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
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');

    const subscriptionService = new SubscriptionService();

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

    let subscriptions;
    if (userId === user.id) {
      subscriptions = await subscriptionService.getUserSubscriptions(userId);
    } else {
      // Admin can get all subscriptions with filters
      const query = supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query.eq('user_id', userId);
      }
      if (tier) {
        query.eq('tier', tier);
      }
      if (status) {
        query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to get subscriptions: ${error.message}`);
      }
      subscriptions = data || [];
    }

    const response = NextResponse.json({
      subscriptions,
      total: subscriptions.length,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, subscriptionRateLimiter);
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
    const { tier, billing_cycle, promotional_code } = body;

    // Validate input data
    const validation = validateSubscriptionCreateData({
      tier,
      billing_cycle,
      promotional_code,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Check if user already has an active subscription
    const currentSubscription =
      await subscriptionService.getCurrentSubscription(user.id);
    if (currentSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Get user email for Stripe customer creation
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!userData?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get request metadata for audit logging
    const headersList = headers();
    const metadata = {
      ipAddress:
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };

    const subscription = await subscriptionService.createSubscription(
      user.id,
      {
        tier,
        billing_cycle,
        promotional_code,
      },
      userData.email,
      metadata
    );

    const response = NextResponse.json({
      subscription,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
