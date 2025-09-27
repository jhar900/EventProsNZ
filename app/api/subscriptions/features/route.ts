import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/subscriptions/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');

    if (tier) {
      // Get features for specific tier
      const { data: features, error } = await supabase
        .from('subscription_features')
        .select('*')
        .eq('tier', tier)
        .order('feature_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to get features: ${error.message}`);
      }

      return NextResponse.json({ features: features || [] });
    } else {
      // Get all features grouped by tier
      const { data: features, error } = await supabase
        .from('subscription_features')
        .select('*')
        .order('tier', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to get features: ${error.message}`);
      }

      // Group features by tier
      const featuresByTier =
        features?.reduce(
          (acc, feature) => {
            if (!acc[feature.tier]) {
              acc[feature.tier] = [];
            }
            acc[feature.tier].push(feature);
            return acc;
          },
          {} as Record<string, any[]>
        ) || {};

      return NextResponse.json({ features: featuresByTier });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tier,
      feature_name,
      feature_description,
      is_included = true,
      limit_value,
    } = body;

    if (!tier || !feature_name) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, feature_name' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('subscription_features')
      .insert({
        tier,
        feature_name,
        feature_description,
        is_included,
        limit_value,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create subscription feature: ${error.message}`
      );
    }

    return NextResponse.json({ feature: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create subscription feature' },
      { status: 500 }
    );
  }
}
