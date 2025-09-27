import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/subscriptions/subscription-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { new_tier, effective_date } = body;

    if (!new_tier) {
      return NextResponse.json(
        { error: 'Missing required field: new_tier' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Check if user owns this subscription or is admin
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const effectiveDate = effective_date ? new Date(effective_date) : undefined;
    const result = await subscriptionService.upgradeSubscription(
      params.id,
      new_tier,
      effectiveDate
    );

    return NextResponse.json({
      subscription: result.subscription,
      proration: result.proration,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
