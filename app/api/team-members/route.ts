import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let user: any = null;
    let cookieUserId: string | null = null;

    // Get x-user-id header (if provided)
    const userIdFromHeader =
      request.headers.get('x-user-id') ||
      request.headers.get('X-User-Id') ||
      request.headers.get('X-USER-ID');

    // STEP 1: Always check cookie-based auth first to get the authenticated session
    const { supabase } = createClient(request);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      cookieUserId = session.user.id;
    } else {
      // Try getUser as fallback
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
      } else if (getUserUser) {
        cookieUserId = getUserUser.id;
      }
    }

    // STEP 2: Determine which user ID to use
    // Priority: cookie session (authoritative) > header (fallback for server-to-server)
    // If cookie exists, it's the authenticated source of truth - use it
    // Header is only used when no cookie session exists
    const effectiveUserId = cookieUserId || userIdFromHeader;

    if (effectiveUserId) {
      // Verify the user exists and get their data
      const { createClient: createServerClient } = await import(
        '@/lib/supabase/server'
      );
      const adminSupabase = createServerClient();
      const { data: userData, error: userError } = await adminSupabase
        .from('users')
        .select('id, email, role')
        .eq('id', effectiveUserId)
        .single();

      if (!userError && userData) {
        user = {
          id: userData.id,
          email: userData.email || '',
          role: userData.role,
        };
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
    // Always fetch role from the users table - don't use auth JWT role which is just "authenticated"
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

    const userRole = userData?.role;

    if (userRole !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can view team members' },
        { status: 403 }
      );
    }

    // Fetch team members from both tables
    // (reusing adminSupabase from above)

    // Fetch team members (from team_members table) - include all statuses
    // Once an invitation is accepted, the record is in team_members table with accepted_at set
    console.log(
      '[Team Members API] Querying team_members table for event_manager_id:',
      user.id
    );

    // Force a fresh read by adding a timestamp to bypass any caching
    // Also ensure we're reading the most recent data
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
        team_member_id,
        event_manager_id,
        updated_at
      `
        )
        .eq('event_manager_id', user.id)
        .in('status', ['invited', 'onboarding', 'active', 'inactive'])
        .order('updated_at', { ascending: false }); // Order by updated_at to ensure fresh data

    console.log('[Team Members API] Fetched from team_members table:', {
      eventManagerId: user.id,
      count: activeMembers?.length || 0,
      members:
        activeMembers?.map(m => ({
          id: m.id,
          event_manager_id: m.event_manager_id,
          team_member_id: m.team_member_id,
          role: m.role,
          status: m.status,
          accepted_at: m.accepted_at,
          rawMember: JSON.stringify(m),
        })) || [],
      error: activeMembersError?.message,
      errorCode: activeMembersError?.code,
      timestamp: new Date().toISOString(),
    });

    // Also check if there are ANY records in team_members table (for debugging)
    const { data: allTeamMembers, error: allError } = await adminSupabase
      .from('team_members')
      .select('id, event_manager_id, team_member_id, status, accepted_at')
      .limit(10);

    console.log(
      '[Team Members API] Sample of ALL team_members records (first 10):',
      {
        totalSample: allTeamMembers?.length || 0,
        records:
          allTeamMembers?.map(m => ({
            id: m.id,
            event_manager_id: m.event_manager_id,
            team_member_id: m.team_member_id,
            status: m.status,
            accepted_at: m.accepted_at,
          })) || [],
      }
    );

    // Fetch user details for active team members
    let teamMemberDetails: any[] = [];
    if (activeMembers && activeMembers.length > 0) {
      const teamMemberIds = activeMembers.map(m => m.team_member_id);

      console.log(
        '[Team Members API] Fetching user details for team members:',
        {
          teamMemberCount: activeMembers.length,
          teamMemberIds: teamMemberIds,
        }
      );

      // Fetch users
      const { data: usersData, error: usersError } = await adminSupabase
        .from('users')
        .select('id, email')
        .in('id', teamMemberIds);

      if (usersError) {
        console.error('[Team Members API] Error fetching users:', usersError);
      }

      // Fetch profiles separately to ensure phone numbers and avatars are retrieved
      const { data: profilesData, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, avatar_url')
        .in('user_id', teamMemberIds);

      if (profilesError) {
        console.error(
          '[Team Members API] Error fetching profiles:',
          profilesError
        );
      }

      console.log('[Team Members API] Fetched user data:', {
        usersCount: usersData?.length || 0,
        profilesCount: profilesData?.length || 0,
      });

      if (!usersError && usersData) {
        // Create a map of profiles by user_id
        const profileMap = new Map();
        if (profilesData && !profilesError) {
          profilesData.forEach((p: any) => {
            profileMap.set(p.user_id, {
              first_name: p.first_name,
              last_name: p.last_name,
              phone: p.phone,
              avatar_url: p.avatar_url,
            });
          });
        }

        // Create a map of user data with profiles
        const userMap = new Map();
        usersData.forEach((u: any) => {
          userMap.set(u.id, {
            email: u.email,
            profile: profileMap.get(u.id) || null,
          });
        });

        // Combine team member data with user data
        teamMemberDetails = activeMembers.map(member => ({
          ...member,
          userData: userMap.get(member.team_member_id) || null,
        }));

        console.log('[Team Members API] Combined team member details:', {
          teamMemberDetailsCount: teamMemberDetails.length,
          membersWithUserData: teamMemberDetails.filter(m => m.userData).length,
          membersWithoutUserData: teamMemberDetails.filter(m => !m.userData)
            .length,
          acceptedMembers: teamMemberDetails
            .filter(m => m.accepted_at)
            .map(m => ({
              id: m.id,
              team_member_id: m.team_member_id,
              role: m.role,
              status: m.status,
              accepted_at: m.accepted_at,
              hasUserData: !!m.userData,
            })),
          allRoles: teamMemberDetails.map(m => ({ id: m.id, role: m.role })),
        });
      } else {
        console.warn(
          '[Team Members API] No user data fetched, but we have active members. Creating teamMemberDetails without user data:',
          {
            activeMembersCount: activeMembers.length,
            usersError: usersError?.message,
          }
        );

        // Still create teamMemberDetails even without user data so team members are shown
        teamMemberDetails = activeMembers.map(member => ({
          ...member,
          userData: null,
        }));
      }
    }

    // Fetch invitations (from team_member_invitations table) - only show pending invitations
    // Don't include accepted invitations (status 'onboarding' or 'active') as they're already in team_members
    const { data: invitations, error: invitationsError } = await adminSupabase
      .from('team_member_invitations')
      .select('*')
      .eq('event_manager_id', user.id)
      .in('status', ['invited', 'inactive']) // Only pending (invited) and declined (inactive) invitations
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

        // If no user data, try to get it from the invitation or use fallback
        let email = userData?.email || '';
        let name = 'Unknown';
        let phone = null;
        let avatar_url = null;

        if (userData) {
          // Prioritize profile name if available, otherwise use email
          const profileName =
            profile && profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : null;

          name = profileName || userData.email || 'Unknown';
          email = userData.email || '';
          phone = profile?.phone || null;
          avatar_url = profile?.avatar_url || null;
        } else {
          // No user data - this shouldn't happen for accepted members, but log it
          console.warn('[Team Members API] Team member has no user data:', {
            memberId: member.id,
            teamMemberId: member.team_member_id,
            status: member.status,
            acceptedAt: member.accepted_at,
          });

          // Use placeholder data - the user should exist if they accepted
          email = `user-${member.team_member_id.substring(0, 8)}`;
          name = 'Team Member';
        }

        // Determine display status: if accepted_at exists, always show as 'accepted'
        // This indicates the team member has accepted the invitation
        let displayStatus =
          member.status === 'inactive' ? 'declined' : member.status;
        if (member.accepted_at && member.status !== 'inactive') {
          // If they've accepted (accepted_at is set), show as 'accepted'
          // This takes precedence over 'onboarding' or 'active' status
          displayStatus = 'accepted';
        }

        const finalRole = member.role;
        console.log('[Team Members API] Adding team member to response:', {
          id: member.id,
          name,
          roleFromMember: member.role,
          finalRole: finalRole,
          status: displayStatus,
        });

        teamMembers.push({
          id: member.id,
          name,
          role: finalRole,
          email,
          phone,
          avatar_url,
          status: displayStatus,
        });
      }
    } else if (activeMembers && activeMembers.length > 0) {
      // If we have active members but no teamMemberDetails, there might be an issue fetching user data
      // Still try to show them with basic info
      console.warn(
        '[Team Members API] Found active members but no user details, adding with basic info:',
        {
          activeMembersCount: activeMembers.length,
          teamMemberIds: activeMembers.map(m => m.team_member_id),
        }
      );

      for (const member of activeMembers) {
        // Try to get user email as fallback
        const { data: fallbackUser } = await adminSupabase
          .from('users')
          .select('email')
          .eq('id', member.team_member_id)
          .maybeSingle();

        let displayStatus =
          member.status === 'inactive' ? 'declined' : member.status;
        if (member.accepted_at && member.status !== 'inactive') {
          displayStatus = 'accepted';
        }

        teamMembers.push({
          id: member.id,
          name: fallbackUser?.email || 'Unknown',
          role: member.role,
          email: fallbackUser?.email || '',
          phone: null,
          avatar_url: null,
          status: displayStatus,
        });
      }
    }

    // Add pending invitations
    // For invitations, check if user exists with that email and use their profile data
    if (invitations && invitations.length > 0) {
      const invitationEmails = invitations.map(inv => inv.email);

      // Check if any users exist with these invitation emails
      const { data: existingUsers, error: existingUsersError } =
        await adminSupabase
          .from('users')
          .select('id, email')
          .in('email', invitationEmails);

      // Fetch profiles for existing users
      let existingUserProfiles: any[] = [];
      if (existingUsers && existingUsers.length > 0 && !existingUsersError) {
        const existingUserIds = existingUsers.map(u => u.id);
        const { data: profilesForInvitations } = await adminSupabase
          .from('profiles')
          .select('user_id, first_name, last_name, phone, avatar_url')
          .in('user_id', existingUserIds);

        if (profilesForInvitations) {
          existingUserProfiles = profilesForInvitations;
        }
      }

      // Create a map of user data by email
      const userByEmailMap = new Map();
      if (existingUsers && !existingUsersError) {
        existingUsers.forEach((u: any) => {
          const profile = existingUserProfiles.find(p => p.user_id === u.id);
          userByEmailMap.set(u.email.toLowerCase(), {
            user_id: u.id,
            profile: profile || null,
          });
        });
      }

      for (const invitation of invitations) {
        const emailKey = invitation.email.toLowerCase();
        const userData = userByEmailMap.get(emailKey);
        const profile = userData?.profile;

        // Prioritize profile name if user has a profile, otherwise use invitation name
        // Check if profile exists and has valid name data
        const profileName =
          profile && profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : null;

        const invitationName =
          `${invitation.first_name} ${invitation.last_name}`.trim();

        // Use profile name if available, otherwise fall back to invitation name
        const name = profileName || invitationName;

        const phone = profile?.phone || null;
        const avatar_url = profile?.avatar_url || null;

        teamMembers.push({
          id: invitation.id,
          name,
          role: invitation.role,
          email: invitation.email,
          phone,
          avatar_url,
          status:
            invitation.status === 'inactive'
              ? 'declined'
              : ('invited' as const),
        });
      }
    }

    console.log('[Team Members API] Returning team members:', {
      totalCount: teamMembers.length,
      fromTeamMembers: teamMemberDetails?.length || 0,
      fromInvitations: invitations?.length || 0,
      activeMembersCount: activeMembers?.length || 0,
      statuses: teamMembers.map(m => ({
        name: m.name,
        email: m.email,
        status: m.status,
      })),
      acceptedMembers: teamMembers
        .filter(m => m.status === 'accepted')
        .map(m => ({ name: m.name, email: m.email })),
    });

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
