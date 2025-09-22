import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // Check if user is an event manager
    if (user.role !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can use this endpoint' },
        { status: 403 }
      );
    }

    // Get user's profile to check completion status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if profile is complete
    const isProfileComplete =
      profile.first_name &&
      profile.last_name &&
      profile.phone &&
      profile.address;

    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error:
            'Profile is not complete. Please complete all required fields.',
          details: {
            missing_fields: [
              !profile.first_name && 'first_name',
              !profile.last_name && 'last_name',
              !profile.phone && 'phone',
              !profile.address && 'address',
            ].filter(Boolean),
          },
        },
        { status: 400 }
      );
    }

    // Verify user (automatic approval for event managers)
    const { error: verifyError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (verifyError) {
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      is_verified: true,
      message: 'User verified successfully',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
