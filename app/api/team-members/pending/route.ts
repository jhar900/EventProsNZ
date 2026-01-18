import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Use admin client to check for pending invitations
    const adminSupabase = createServerClient();

    // Check if user has a pending invitation first
    // Only check for invitations with status 'invited' (not 'onboarding' or 'active' which means accepted)
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('team_member_invitations')
      .select('id, invite_token, expires_at, updated_at, event_manager_id')
      .eq('email', user.email)
      .eq('status', 'invited') // Only pending invitations, not accepted ones
      .gt('expires_at', new Date().toISOString()) // Only non-expired invitations
      .maybeSingle();

    if (invitationError) {
      console.error('Error checking for pending invitation:', invitationError);
      return NextResponse.json(
        {
          error: 'Failed to check for pending invitations',
          details: invitationError.message,
        },
        { status: 500 }
      );
    }

    // If there's a pending invitation, check if user has already accepted from this event manager
    if (invitation) {
      // Check if user has already accepted an invitation from THIS SPECIFIC event manager
      const { data: existingTeamMember } = await adminSupabase
        .from('team_members')
        .select('id, accepted_at, event_manager_id')
        .eq('team_member_id', user.id)
        .eq('event_manager_id', invitation.event_manager_id) // Same event manager
        .not('accepted_at', 'is', null)
        .maybeSingle();

      // If user has already accepted from this event manager, don't show the invitation
      if (existingTeamMember && existingTeamMember.accepted_at) {
        console.log(
          '[Pending Invitation] User has already accepted invitation from this event manager, not showing modal'
        );
        return NextResponse.json({
          success: true,
          hasPendingInvitation: false,
          alreadyAccepted: true,
        });
      }

      // User hasn't accepted from this event manager, show the invitation
      return NextResponse.json({
        success: true,
        hasPendingInvitation: true,
        invitationToken: invitation.invite_token,
      });
    }

    // No pending invitation found
    return NextResponse.json({
      success: true,
      hasPendingInvitation: false,
    });
  } catch (error) {
    console.error('Error in GET /api/team-members/pending:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
