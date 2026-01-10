import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user - use getSession() first to avoid refresh token errors
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // If no session, try getUser (but handle refresh token errors)
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      // Handle refresh token errors gracefully
      if (authError) {
        // Only return early for refresh token errors - other errors will fall through to header check
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
        // Don't return here - continue to header fallback check
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
        // Verify the user exists - use admin client to bypass RLS
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
          // Create a minimal user object
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
      // Use admin client to bypass RLS if needed
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
          error: 'Only event managers can view team members',
          userRole: userRole,
        },
        { status: 403 }
      );
    }

    // Fetch team members from both tables
    const { createClient: createServerClient } = await import(
      '@/lib/supabase/server'
    );
    const adminSupabase = createServerClient();

    // Fetch active team members (from team_members table)
    const { data: activeMembers, error: activeMembersError } =
      await adminSupabase
        .from('team_members')
        .select(
          `
        id,
        role,
        status,
        invited_at,
        accepted_at,
        team_member_id
      `
        )
        .eq('event_manager_id', user.id)
        .in('status', ['invited', 'onboarding', 'active']);

    // Fetch user details for active team members
    let teamMemberDetails: any[] = [];
    if (activeMembers && activeMembers.length > 0) {
      const teamMemberIds = activeMembers.map(m => m.team_member_id);
      const { data: usersData, error: usersError } = await adminSupabase
        .from('users')
        .select(
          `
          id,
          email,
          profiles (
            first_name,
            last_name,
            phone
          )
        `
        )
        .in('id', teamMemberIds);

      if (!usersError && usersData) {
        // Create a map of user data
        const userMap = new Map();
        usersData.forEach((u: any) => {
          const profile = Array.isArray(u.profiles)
            ? u.profiles[0]
            : u.profiles;
          userMap.set(u.id, {
            email: u.email,
            profile: profile || null,
          });
        });

        // Combine team member data with user data
        teamMemberDetails = activeMembers.map(member => ({
          ...member,
          userData: userMap.get(member.team_member_id) || null,
        }));
      }
    }

    // Fetch pending invitations (from team_member_invitations table)
    const { data: invitations, error: invitationsError } = await adminSupabase
      .from('team_member_invitations')
      .select('*')
      .eq('event_manager_id', user.id)
      .eq('status', 'invited')
      .gt('expires_at', new Date().toISOString()); // Only non-expired invitations

    if (activeMembersError || invitationsError) {
      console.error('Error fetching team members:', {
        activeMembersError,
        invitationsError,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch team members',
          details: activeMembersError?.message || invitationsError?.message,
        },
        { status: 500 }
      );
    }

    // Combine and format the data
    const teamMembers = [];

    // Add active team members
    if (teamMemberDetails && teamMemberDetails.length > 0) {
      for (const member of teamMemberDetails) {
        const userData = member.userData;
        const profile = userData?.profile;

        teamMembers.push({
          id: member.id,
          name: profile
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : userData?.email || 'Unknown',
          role: member.role,
          email: userData?.email || '',
          phone: profile?.phone || null,
          status: member.status,
        });
      }
    }

    // Add pending invitations
    if (invitations) {
      for (const invitation of invitations) {
        teamMembers.push({
          id: invitation.id,
          name: `${invitation.first_name} ${invitation.last_name}`.trim(),
          role: invitation.role,
          email: invitation.email,
          phone: null,
          status: 'invited' as const,
        });
      }
    }

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team members',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
