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

    const subscriptionService = new SubscriptionService();
    const tiers = await subscriptionService.getSubscriptionTiers();

    // Get features for each tier
    const { data: features, error: featuresError } = await supabase
      .from('subscription_features')
      .select('*')
      .order('tier', { ascending: true });

    if (featuresError) {
      throw new Error(`Failed to get features: ${featuresError.message}`);
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

    return NextResponse.json({
      tiers,
      features: featuresByTier,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers' },
      { status: 500 }
    );
  }
}
