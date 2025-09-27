import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/subscriptions/subscription-service';

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

    const body = await request.json();
    const { code, tier } = body;

    if (!code || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: code, tier' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    const result = await subscriptionService.validatePromotionalCode(
      code,
      tier
    );

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        discount: null,
      });
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate promotional code' },
      { status: 500 }
    );
  }
}
