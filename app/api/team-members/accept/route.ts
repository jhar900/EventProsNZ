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
      console.log('[Accept Invitation] No session found, trying getUser()...');
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !getUserUser) {
        // Fallback: Try to get user ID from header (for immediate post-signup calls)
        const userIdFromHeader = request.headers.get('x-user-id');
        if (userIdFromHeader) {
          console.log(
            '[Accept Invitation] Using user ID from header as fallback'
          );
          // We'll verify this user ID matches the invitation email below
          user = { id: userIdFromHeader } as any;
        } else {
          console.error('[Accept Invitation] Failed to get user:', {
            authError: authError?.message,
            hasUser: !!getUserUser,
            hasHeaderUserId: !!userIdFromHeader,
            cookies: request.cookies.getAll().map(c => c.name),
          });
          return NextResponse.json(
            { error: 'Unauthorized. Please log in first.' },
            { status: 401 }
          );
        }
      } else {
        user = getUserUser;
        console.log('[Accept Invitation] Got user via getUser():', user.id);
      }
    } else {
      console.log('[Accept Invitation] Got user from session:', user.id);
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
          '[Accept Invitation] Failed to fetch user email:',
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
      .select('id, status, accepted_at')
      .eq('event_manager_id', invitation.event_manager_id)
      .eq('team_member_id', user.id)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    // Handle query errors (but allow PGRST116 - no rows found)
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking for existing team member:', existingError);
      return NextResponse.json(
        {
          error: 'Failed to check team member status',
          details: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingMember) {
      // If already accepted, return success without doing anything
      if (existingMember.accepted_at) {
        return NextResponse.json({
          success: true,
          message: 'You have already accepted this invitation',
          alreadyAccepted: true,
          teamMember: existingMember,
        });
      }

      // Relationship exists but not accepted yet, update status based on onboarding status
      const newStatus = isOnboarded ? 'active' : 'onboarding';

      // Update team member status and set accepted_at
      const { error: updateError } = await adminSupabase
        .from('team_members')
        .update({
          status: newStatus,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('Error updating team member status:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update team member status',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Update invitation status
      const { error: invitationUpdateError } = await adminSupabase
        .from('team_member_invitations')
        .update({
          status: newStatus,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (invitationUpdateError) {
        console.error(
          'Error updating invitation status:',
          invitationUpdateError
        );
        // Log but don't fail - the team member relationship is already created
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
        teamMember: {
          ...existingMember,
          accepted_at: new Date().toISOString(),
          status: newStatus,
        },
      });
    }

    // Create team member relationship with status based on onboarding status
    // For new users who just signed up, they won't have a profile yet, so status should be 'onboarding'
    const initialStatus = isOnboarded ? 'active' : 'onboarding';

    console.log('[Accept Invitation] Creating team member:', {
      userId: user.id,
      userEmail: user.email,
      eventManagerId: invitation.event_manager_id,
      role: invitation.role,
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
        '[Accept Invitation] Error creating team member relationship:',
        {
          error: teamMemberError,
          code: teamMemberError.code,
          message: teamMemberError.message,
          details: teamMemberError.details,
          hint: teamMemberError.hint,
        }
      );
      return NextResponse.json(
        {
          error: 'Failed to accept invitation',
          details: teamMemberError.message,
          code: teamMemberError.code,
        },
        { status: 500 }
      );
    }

    if (!teamMember) {
      console.error('[Accept Invitation] Team member insert returned no data');
      return NextResponse.json(
        {
          error: 'Failed to accept invitation',
          details: 'Team member record was not created',
        },
        { status: 500 }
      );
    }

    console.log('[Accept Invitation] Team member created successfully:', {
      teamMemberId: teamMember.id,
      status: teamMember.status,
    });

    // Update invitation status to match team member status (onboarding or active, not 'invited')
    // This ensures the pending invitation check won't find it again
    const { error: invitationUpdateError } = await adminSupabase
      .from('team_member_invitations')
      .update({
        status: initialStatus, // 'onboarding' or 'active', not 'invited'
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    console.error('[Accept Invitation] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to accept invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
