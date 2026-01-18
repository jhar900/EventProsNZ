import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('[Update Role API] PATCH endpoint called');
    const { supabase } = createClient(request);
    const resolvedParams = params instanceof Promise ? await params : params;
    const teamMemberId = resolvedParams.id;
    console.log('[Update Role API] Resolved teamMemberId:', teamMemberId);

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // If no session, try getUser
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token') ||
          authError.message?.includes('Refresh Token Not Found')
        ) {
          return NextResponse.json(
            {
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          );
        }
      } else {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user ID from header if cookies aren't working
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (!userError && userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'No user found after authentication attempts',
          code: 'NO_USER',
        },
        { status: 401 }
      );
    }

    // Verify user is an event manager
    let userRole: string | undefined = (user as any).role;

    if (!userRole) {
      const { createClient: createServerClient } = await import(
        '@/lib/supabase/server'
      );
      const adminSupabase = createServerClient();

      const { data: userData, error: userDataError } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        return NextResponse.json(
          {
            error: 'Failed to verify user role',
            details: userDataError.message,
          },
          { status: 500 }
        );
      }

      userRole = userData?.role;
    }

    if (userRole !== 'event_manager') {
      return NextResponse.json(
        {
          error: 'Only event managers can update team members',
          userRole: userRole,
        },
        { status: 403 }
      );
    }

    // Get the role from request body
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        {
          error: 'Role is required',
        },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const { createClient: createServerClient } = await import(
      '@/lib/supabase/server'
    );
    const adminSupabase = createServerClient();

    console.log('[Update Role API] Attempting to update role:', {
      teamMemberId,
      userId: user.id,
      newRole: role,
    });

    // Try to update in team_members table first
    const { data: teamMember, error: teamMemberError } = await adminSupabase
      .from('team_members')
      .select('id, event_manager_id, team_member_id, role')
      .eq('id', teamMemberId)
      .eq('event_manager_id', user.id)
      .maybeSingle();

    console.log('[Update Role API] Team member lookup result:', {
      found: !!teamMember,
      error: teamMemberError?.message,
      currentRole: teamMember?.role,
      teamMemberId: teamMember?.id,
    });

    if (teamMember) {
      // Get the team member's user email to find the related invitation
      const { data: teamMemberUser } = await adminSupabase
        .from('users')
        .select('email')
        .eq('id', teamMember.team_member_id)
        .single();

      // Update role in team_members table
      console.log('[Update Role API] Updating role in team_members table:', {
        teamMemberId,
        oldRole: teamMember.role,
        newRole: role,
      });

      const { data: updateResult, error: updateError } = await adminSupabase
        .from('team_members')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamMemberId)
        .eq('event_manager_id', user.id)
        .select('id, role');

      if (updateError) {
        console.error(
          '[Update Role API] Error updating team member role:',
          updateError
        );
        return NextResponse.json(
          {
            error: 'Failed to update team member role',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('[Update Role API] No rows were updated:', {
          teamMemberId,
          eventManagerId: user.id,
        });
        return NextResponse.json(
          {
            error: 'No team member found to update',
            details:
              'The team member record was not found or does not belong to you',
          },
          { status: 404 }
        );
      }

      console.log('[Update Role API] Successfully updated team member role:', {
        teamMemberId: updateResult[0]?.id,
        newRole: updateResult[0]?.role,
        rowsUpdated: updateResult.length,
      });

      // Verify the update by querying the record again
      const { data: verifyMember, error: verifyError } = await adminSupabase
        .from('team_members')
        .select('id, role')
        .eq('id', teamMemberId)
        .single();

      if (verifyError) {
        console.warn('[Update Role API] Could not verify update:', verifyError);
      } else {
        console.log('[Update Role API] Verified update:', {
          teamMemberId: verifyMember?.id,
          verifiedRole: verifyMember?.role,
          matchesExpected: verifyMember?.role === role,
        });
      }

      // Also update the invitation if it exists (find by email and event_manager_id)
      if (teamMemberUser?.email) {
        const { data: invitation } = await adminSupabase
          .from('team_member_invitations')
          .select('id')
          .eq('event_manager_id', user.id)
          .eq('email', teamMemberUser.email)
          .maybeSingle();

        if (invitation) {
          const { error: invitationUpdateError } = await adminSupabase
            .from('team_member_invitations')
            .update({
              role: role,
              updated_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

          if (invitationUpdateError) {
            console.warn(
              '[Update Role API] Failed to update invitation role (non-critical):',
              invitationUpdateError
            );
          } else {
            console.log('[Update Role API] Also updated invitation role');
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Team member role updated successfully',
      });
    }

    // If not found in team_members, try team_member_invitations
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('team_member_invitations')
      .select('id, event_manager_id')
      .eq('id', teamMemberId)
      .eq('event_manager_id', user.id)
      .single();

    if (invitation && !invitationError) {
      // Update role in team_member_invitations table
      const { error: updateError } = await adminSupabase
        .from('team_member_invitations')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamMemberId)
        .eq('event_manager_id', user.id);

      if (updateError) {
        console.error(
          '[Update Role API] Error updating invitation role:',
          updateError
        );
        return NextResponse.json(
          {
            error: 'Failed to update invitation role',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      console.log('[Update Role API] Successfully updated invitation role');
      return NextResponse.json({
        success: true,
        message: 'Invitation role updated successfully',
      });
    }

    // Not found in either table
    return NextResponse.json(
      {
        error: 'Team member or invitation not found',
        details:
          'The specified team member or invitation does not exist or does not belong to you',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating team member role:', error);
    return NextResponse.json(
      {
        error: 'Failed to update team member role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const resolvedParams = params instanceof Promise ? await params : params;
    const teamMemberId = resolvedParams.id;

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // If no session, try getUser
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token') ||
          authError.message?.includes('Refresh Token Not Found')
        ) {
          return NextResponse.json(
            {
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          );
        }
      } else {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user ID from header if cookies aren't working
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (!userError && userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'No user found after authentication attempts',
          code: 'NO_USER',
        },
        { status: 401 }
      );
    }

    // Verify user is an event manager
    let userRole: string | undefined = (user as any).role;

    if (!userRole) {
      const { createClient: createServerClient } = await import(
        '@/lib/supabase/server'
      );
      const adminSupabase = createServerClient();

      const { data: userData, error: userDataError } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        return NextResponse.json(
          {
            error: 'Failed to verify user role',
            details: userDataError.message,
          },
          { status: 500 }
        );
      }

      userRole = userData?.role;
    }

    if (userRole !== 'event_manager') {
      return NextResponse.json(
        {
          error: 'Only event managers can remove team members',
          userRole: userRole,
        },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS
    const { createClient: createServerClient } = await import(
      '@/lib/supabase/server'
    );
    const adminSupabase = createServerClient();

    // Try to find in team_members table first
    const { data: teamMember, error: teamMemberError } = await adminSupabase
      .from('team_members')
      .select('id, event_manager_id')
      .eq('id', teamMemberId)
      .eq('event_manager_id', user.id)
      .single();

    if (teamMember && !teamMemberError) {
      // Delete from team_members table
      const { error: deleteError } = await adminSupabase
        .from('team_members')
        .delete()
        .eq('id', teamMemberId)
        .eq('event_manager_id', user.id);

      if (deleteError) {
        console.error('Error deleting team member:', deleteError);
        return NextResponse.json(
          {
            error: 'Failed to remove team member',
            details: deleteError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Team member removed successfully',
      });
    }

    // If not found in team_members, try team_member_invitations
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('team_member_invitations')
      .select('id, event_manager_id')
      .eq('id', teamMemberId)
      .eq('event_manager_id', user.id)
      .single();

    if (invitation && !invitationError) {
      // Delete from team_member_invitations table
      const { error: deleteError } = await adminSupabase
        .from('team_member_invitations')
        .delete()
        .eq('id', teamMemberId)
        .eq('event_manager_id', user.id);

      if (deleteError) {
        console.error('Error deleting invitation:', deleteError);
        return NextResponse.json(
          {
            error: 'Failed to remove invitation',
            details: deleteError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation removed successfully',
      });
    }

    // Not found in either table
    return NextResponse.json(
      {
        error: 'Team member or invitation not found',
        details:
          'The specified team member or invitation does not exist or does not belong to you',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove team member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
