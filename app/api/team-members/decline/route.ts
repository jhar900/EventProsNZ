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

    // Use admin client to update invitation
    const adminSupabase = createServerClient();

    // Find the invitation
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
    // If we only have a user ID (from header fallback), fetch the user's email
    let userEmail = user.email;
    if (!userEmail && user.id) {
      const { data: userData, error: userError } = await adminSupabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.error(
          '[Decline Invitation] Failed to fetch user email:',
          userError
        );
        return NextResponse.json(
          {
            error: 'Failed to verify user',
            details: 'Could not verify user email',
          },
          { status: 500 }
        );
      }

      userEmail = userData.email;
    }

    if (!userEmail || invitation.email !== userEmail) {
      return NextResponse.json(
        {
          error: 'Email mismatch',
          details: 'The invitation email does not match your account email',
        },
        { status: 403 }
      );
    }

    // Check if a team_members record exists for this invitation
    // This can happen if the user accepted the invitation but then declined, or if there's a record from a previous acceptance
    const { data: existingTeamMember, error: teamMemberCheckError } =
      await adminSupabase
        .from('team_members')
        .select('id, status')
        .eq('event_manager_id', invitation.event_manager_id)
        .eq('team_member_id', user.id)
        .maybeSingle();

    // Update invitation status to 'inactive' (declined invitations)
    // Note: The enum doesn't have 'declined', so we use 'inactive' to mark declined invitations
    const { error: updateError } = await adminSupabase
      .from('team_member_invitations')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error(
        '[Decline Invitation] Error updating invitation status:',
        updateError
      );
      return NextResponse.json(
        {
          error: 'Failed to decline invitation',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // If a team_members record exists, also update its status to 'inactive' (declined)
    if (existingTeamMember && !teamMemberCheckError) {
      const { error: teamMemberUpdateError } = await adminSupabase
        .from('team_members')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTeamMember.id);

      if (teamMemberUpdateError) {
        console.error(
          '[Decline Invitation] Error updating team member status:',
          teamMemberUpdateError
        );
        // Don't fail the request, but log the error
        // The invitation was already updated, so we'll return success
      } else {
        console.log(
          '[Decline Invitation] Team member status also updated to inactive'
        );
      }
    }

    console.log('[Decline Invitation] Invitation declined successfully:', {
      invitationId: invitation.id,
      email: invitation.email,
      teamMemberUpdated: !!existingTeamMember,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('[Decline Invitation] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to decline invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
