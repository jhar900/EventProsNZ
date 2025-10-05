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

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get tier features
    const { data: features, error: featuresError } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('tier', tier)
      .eq('is_included', true)
      .order('feature_name');

    if (featuresError) {
      throw new Error(`Failed to get tier features: ${featuresError.message}`);
    }

    // Get tier limits
    const limits =
      features?.reduce(
        (acc, feature) => {
          if (feature.limit_value) {
            acc[feature.feature_name] = feature.limit_value;
          }
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const response = NextResponse.json({
      features: features || [],
      limits,
      tier,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tier features' },
      { status: 500 }
    );
  }
}
