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
    const { tier } = body;

    if (!tier) {
      return NextResponse.json(
        { error: 'Missing required field: tier' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Check if user is a contractor
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'contractor') {
      return NextResponse.json(
        { error: 'Only contractors can start trials' },
        { status: 400 }
      );
    }

    const trial = await subscriptionService.startTrial(user.id, tier);

    return NextResponse.json({
      trial,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
}
