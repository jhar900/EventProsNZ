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
    const { tier, billing_cycle, promotional_code } = body;

    if (!tier || !billing_cycle) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billing_cycle' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    const pricing = await subscriptionService.calculatePricing(
      tier,
      billing_cycle,
      promotional_code
    );

    return NextResponse.json({
      total_price: pricing.base_price,
      discount_applied: pricing.discount_applied,
      final_price: pricing.final_price,
      savings: pricing.savings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
