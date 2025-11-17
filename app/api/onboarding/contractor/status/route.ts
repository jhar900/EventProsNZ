import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client) - same approach as other steps
    let userId = request.headers.get('x-user-id');

    let supabase;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      console.log(
        'Status API - Using service role client with userId from header:',
        userId
      );
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      if (authError || !user) {
        // Only log if it's not an expected auth error
        if (
          authError?.message &&
          !authError.message.includes('Refresh Token') &&
          !authError.message.includes('refresh_token_not-found') &&
          !authError.message.includes('Auth session') &&
          !authError.message.includes('session missing')
        ) {
          console.error('Auth error in status:', authError.message);
        }
        // Return default values instead of error
        return NextResponse.json({
          step1_completed: false,
          step2_completed: false,
          step3_completed: false,
          step4_completed: false,
          is_submitted: false,
          approval_status: 'pending',
        });
      }
      supabase = middlewareSupabase;
      userId = user.id;
      console.log('Status API - Using middleware client with userId:', userId);
    }

    // Get onboarding status
    const { data: onboardingStatus, error: statusError } = await supabase
      .from('contractor_onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Status API - onboardingStatus:', onboardingStatus);
    console.log('Status API - statusError:', statusError);

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('Status API - Error fetching status:', statusError);
      return NextResponse.json(
        { error: 'Failed to fetch onboarding status' },
        { status: 500 }
      );
    }

    // If no status found, return default values
    if (!onboardingStatus) {
      console.log('Status API - No status found, returning defaults');
      return NextResponse.json({
        step1_completed: false,
        step2_completed: false,
        step3_completed: false,
        step4_completed: false,
        is_submitted: false,
        approval_status: 'pending',
      });
    }

    console.log('Status API - Returning status:', onboardingStatus);
    return NextResponse.json(onboardingStatus);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
