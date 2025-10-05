import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, { requests: 100, window: '1m' });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitResult.headers }
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

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({
        early_access_features: [],
        has_early_access: false,
      });
    }

    // Check if user has access to early access features
    const hasAccess = await checkEarlyAccessAccess(subscription.tier, tier);

    if (!hasAccess) {
      return NextResponse.json({
        early_access_features: [],
        has_early_access: false,
      });
    }

    // Get early access features
    const { data: earlyAccessFeatures, error } = await supabase
      .from('early_access_features')
      .select('*')
      .eq('is_active', true)
      .lte('tier_required', subscription.tier)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get early access features: ${error.message}`);
    }

    const response = NextResponse.json({
      early_access_features: earlyAccessFeatures || [],
      has_early_access: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch early access features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, { requests: 50, window: '1m' });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitResult.headers }
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
    const { feature_name, reason } = body;

    if (!feature_name || !reason) {
      return NextResponse.json(
        { error: 'Feature name and reason are required' },
        { status: 400 }
      );
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Check if user has access to early access features
    const hasAccess = await checkEarlyAccessAccess(subscription.tier);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient subscription tier for early access' },
        { status: 403 }
      );
    }

    // Create early access request
    const { data: request, error } = await supabase
      .from('early_access_requests')
      .insert({
        user_id: user.id,
        feature_name,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create early access request: ${error.message}`
      );
    }

    const response = NextResponse.json({
      request,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create early access request' },
      { status: 500 }
    );
  }
}

// Helper function to check early access access
async function checkEarlyAccessAccess(
  userTier: string,
  requestedTier?: string
): Promise<boolean> {
  const tierHierarchy = {
    essential: 1,
    showcase: 2,
    spotlight: 3,
  };

  const requiredTier = requestedTier || 'showcase';
  return (
    tierHierarchy[userTier as keyof typeof tierHierarchy] >=
    tierHierarchy[requiredTier as keyof typeof tierHierarchy]
  );
}
