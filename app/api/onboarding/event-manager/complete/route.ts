import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get user's profile and business profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Verify user as event manager (automatic approval for account)
    // If they don't have a business profile, they're fully approved (no business to verify)
    // If they have a business profile, only the user account is approved, business needs admin verification
    const { error: verifyError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (verifyError) {
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    // If event manager doesn't have a business profile, they're automatically approved
    // (No business to verify, so they're fully approved)
    // If they have a business profile, business_profiles.is_verified remains false
    // and will need admin verification

    // Update profile completion status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          ...profile.preferences,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile completion status' },
        { status: 500 }
      );
    }

    // Update team member status from 'onboarding' to 'active' if user is a team member
    const { error: teamMemberUpdateError } = await supabase
      .from('team_members')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('team_member_id', userId)
      .eq('status', 'onboarding');

    if (teamMemberUpdateError) {
      // Log but don't fail - user might not be a team member
      console.warn(
        'Failed to update team member status:',
        teamMemberUpdateError
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        is_verified: true,
      },
      profile: {
        ...profile,
        preferences: {
          ...profile.preferences,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        },
      },
      business_profile: businessProfile,
      message: 'Onboarding completed successfully',
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
