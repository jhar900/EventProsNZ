import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !getUserUser) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in first.' },
          { status: 401 }
        );
      }

      user = getUserUser;
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Use admin client to fetch invitation
    const adminSupabase = createServerClient();

    // Find the invitation - check for both 'invited' and 'onboarding' status
    // (in case it was already partially processed)
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('team_member_invitations')
      .select('*')
      .eq('invite_token', token)
      .in('status', ['invited', 'onboarding'])
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        {
          error: 'Invalid or expired invitation',
          details: invitationError?.message || 'Invitation not found',
        },
        { status: 404 }
      );
    }

    // Verify the email matches
    if (invitation.email !== user.email) {
      return NextResponse.json(
        {
          error: 'Email mismatch',
          details: 'The invitation email does not match your account email',
        },
        { status: 403 }
      );
    }

    // Check if user is onboarded (has profile with first name, last name, and avatar)
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    const isOnboarded =
      profile?.first_name && profile?.last_name && profile?.avatar_url;

    // Check if team member relationship already exists
    const { data: existingMember, error: existingError } = await adminSupabase
      .from('team_members')
      .select('id, status')
      .eq('event_manager_id', invitation.event_manager_id)
      .eq('team_member_id', user.id)
      .single();

    if (existingMember) {
      // Relationship already exists, update status based on onboarding status
      const newStatus = isOnboarded ? 'active' : 'onboarding';

      // Update team member status if needed
      if (existingMember.status !== newStatus) {
        await adminSupabase
          .from('team_members')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMember.id);
      }

      // Update invitation status
      await adminSupabase
        .from('team_member_invitations')
        .update({
          status: newStatus,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        message: 'You are already a team member',
      });
    }

    // Create team member relationship with status based on onboarding status
    // For new users who just signed up, they won't have a profile yet, so status should be 'onboarding'
    const initialStatus = isOnboarded ? 'active' : 'onboarding';

    console.log('[Accept Invitation] User onboarding status:', {
      userId: user.id,
      userEmail: user.email,
      hasProfile: !!profile,
      isOnboarded,
      initialStatus,
    });

    const { data: teamMember, error: teamMemberError } = await adminSupabase
      .from('team_members')
      .insert({
        event_manager_id: invitation.event_manager_id,
        team_member_id: user.id,
        role: invitation.role,
        status: initialStatus,
        invited_at: invitation.created_at,
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (teamMemberError) {
      console.error(
        'Error creating team member relationship:',
        teamMemberError
      );
      return NextResponse.json(
        {
          error: 'Failed to accept invitation',
          details: teamMemberError.message,
        },
        { status: 500 }
      );
    }

    console.log('[Accept Invitation] Team member created:', {
      teamMemberId: teamMember.id,
      status: teamMember.status,
    });

    // Update invitation status to match team member status
    const { error: invitationUpdateError } = await adminSupabase
      .from('team_member_invitations')
      .update({
        status: initialStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (invitationUpdateError) {
      console.error('Error updating invitation status:', invitationUpdateError);
      // Don't fail the request, but log the error
    } else {
      console.log(
        '[Accept Invitation] Invitation status updated to:',
        initialStatus
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      teamMember,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      {
        error: 'Failed to accept invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
