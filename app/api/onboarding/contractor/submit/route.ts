import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client) - same approach as other steps
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    // This bypasses RLS and avoids cookie/session issues
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Check if all steps are completed
    const { data: onboardingStatus, error: statusError } = await supabase
      .from('contractor_onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statusError || !onboardingStatus) {
      return NextResponse.json(
        { error: 'Onboarding status not found' },
        { status: 404 }
      );
    }

    if (
      !onboardingStatus.step1_completed ||
      !onboardingStatus.step2_completed ||
      !onboardingStatus.step3_completed ||
      !onboardingStatus.step4_completed
    ) {
      return NextResponse.json(
        { error: 'All onboarding steps must be completed before submission' },
        { status: 400 }
      );
    }

    if (onboardingStatus.is_submitted) {
      return NextResponse.json(
        { error: 'Profile has already been submitted for approval' },
        { status: 400 }
      );
    }

    // Submit for approval
    const { error: submitError } = await supabase
      .from('contractor_onboarding_status')
      .update({
        is_submitted: true,
        submission_date: new Date().toISOString(),
        approval_status: 'pending',
      })
      .eq('user_id', userId);

    if (submitError) {
      return NextResponse.json(
        { error: 'Failed to submit profile for approval' },
        { status: 500 }
      );
    }

    // TODO: Send admin notification email
    // This would typically integrate with SendGrid or similar service
    return NextResponse.json({
      success: true,
      status: 'pending_approval',
      message: 'Profile submitted for approval successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
