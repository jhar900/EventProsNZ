import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get onboarding status
    const { data: onboardingStatus, error: statusError } = await supabase
      .from('contractor_onboarding_status')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch onboarding status' },
        { status: 500 }
      );
    }

    // If no status found, return default values
    if (!onboardingStatus) {
      return NextResponse.json({
        step1_completed: false,
        step2_completed: false,
        step3_completed: false,
        step4_completed: false,
        is_submitted: false,
        approval_status: 'pending',
      });
    }

    return NextResponse.json(onboardingStatus);
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
