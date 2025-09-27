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
    const userId = searchParams.get('user_id') || user.id;

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

    const subscriptionService = new SubscriptionService();
    const trial = await subscriptionService.getTrialStatus(userId);

    if (!trial) {
      return NextResponse.json({
        trial: null,
        days_remaining: 0,
      });
    }

    return NextResponse.json({
      trial,
      days_remaining: trial.days_remaining,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trial status' },
      { status: 500 }
    );
  }
}
