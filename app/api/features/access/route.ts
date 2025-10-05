import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';
import { validateFeatureAccess } from '@/lib/middleware/featureAccess';
import { featureAccessService } from '@/lib/features/feature-access-service';

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
    const featureName = searchParams.get('feature_name');

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

    // Get user's subscription tier
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
        features: [],
        accessible: false,
        tier: 'essential',
      });
    }

    // Use centralized feature access service for validation
    let features = [];
    let accessible = false;

    if (featureName) {
      // Validate specific feature access using server-side validation
      const validation = await featureAccessService.validateFeatureAccess(
        userId,
        featureName
      );
      accessible = validation.hasAccess;

      if (validation.hasAccess) {
        features = [
          {
            user_id: userId,
            feature_name: featureName,
            tier_required: subscription.tier,
            is_accessible: true,
            access_granted_at: new Date().toISOString(),
          },
        ];
      }
    } else {
      // Get all accessible features using server-side validation
      const accessibleFeatures =
        await featureAccessService.getAccessibleFeatures(userId);
      accessible = accessibleFeatures.length > 0;

      features = accessibleFeatures.map(feature => ({
        user_id: userId,
        feature_name: feature,
        tier_required: subscription.tier,
        is_accessible: true,
        access_granted_at: new Date().toISOString(),
      }));
    }

    // Get tier-specific features
    const tierFeatures = await featureAccessService.getTierFeatures(
      subscription.tier
    );

    const response = NextResponse.json({
      features,
      accessible,
      tier: subscription.tier,
      tierFeatures,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch feature access' },
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
    const { feature_name, tier_required } = body;

    if (!feature_name || !tier_required) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's current subscription
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

    // Use server-side validation to check feature access
    const validation = await featureAccessService.validateFeatureAccess(
      user.id,
      feature_name
    );

    if (!validation.hasAccess) {
      return NextResponse.json(
        {
          error: 'Feature access denied',
          reason: validation.reason,
          tier: validation.tier,
        },
        { status: 403 }
      );
    }

    // Grant feature access using centralized service
    const success = await featureAccessService.grantFeatureAccess(
      user.id,
      feature_name,
      tier_required
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to grant feature access' },
        { status: 500 }
      );
    }

    // Get the created feature access record
    const { data: featureAccess } = await supabase
      .from('feature_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature_name', feature_name)
      .single();

    const response = NextResponse.json({
      featureAccess,
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create feature access' },
      { status: 500 }
    );
  }
}

// Helper function to check feature access based on tier
function checkFeatureAccess(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = {
    essential: 1,
    showcase: 2,
    spotlight: 3,
  };

  return (
    tierHierarchy[userTier as keyof typeof tierHierarchy] >=
    tierHierarchy[requiredTier as keyof typeof tierHierarchy]
  );
}
