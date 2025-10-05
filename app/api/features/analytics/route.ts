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
        analytics: null,
        features: [],
        has_analytics_access: false,
      });
    }

    // Check if user has access to advanced analytics
    const hasAccess = await checkAnalyticsAccess(subscription.tier, tier);

    if (!hasAccess) {
      return NextResponse.json({
        analytics: null,
        features: [],
        has_analytics_access: false,
      });
    }

    // Get analytics data
    const analytics = await getAdvancedAnalytics(userId, dateFrom, dateTo);

    // Get analytics features for the tier
    const { data: analyticsFeatures } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('tier', subscription.tier)
      .like('feature_name', 'analytics_%')
      .eq('is_included', true);

    const response = NextResponse.json({
      analytics,
      features: analyticsFeatures || [],
      has_analytics_access: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper function to check analytics access
async function checkAnalyticsAccess(
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

// Helper function to get advanced analytics data
async function getAdvancedAnalytics(
  userId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const supabase = createClient();

  // Get profile views
  const { data: profileViews } = await supabase
    .from('profile_views')
    .select('*')
    .eq('contractor_id', userId)
    .gte(
      'created_at',
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte('created_at', dateTo || new Date().toISOString());

  // Get search appearances
  const { data: searchAppearances } = await supabase
    .from('search_analytics')
    .select('*')
    .eq('contractor_id', userId)
    .gte(
      'created_at',
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte('created_at', dateTo || new Date().toISOString());

  // Get contact inquiries
  const { data: inquiries } = await supabase
    .from('enquiries')
    .select('*')
    .eq('contractor_id', userId)
    .gte(
      'created_at',
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte('created_at', dateTo || new Date().toISOString());

  return {
    profile_views: profileViews?.length || 0,
    search_appearances: searchAppearances?.length || 0,
    inquiries: inquiries?.length || 0,
    conversion_rate:
      inquiries?.length && profileViews?.length
        ? (inquiries.length / profileViews.length) * 100
        : 0,
    top_search_terms: searchAppearances?.slice(0, 5) || [],
    recent_activity: [
      ...(profileViews || []).slice(0, 10),
      ...(searchAppearances || []).slice(0, 10),
      ...(inquiries || []).slice(0, 10),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };
}
