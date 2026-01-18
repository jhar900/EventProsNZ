import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch only team members from team_members table (for event assignment)
// This excludes invitations from team_member_invitations table
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let user = session?.user;

    // Fallback: Try to get user ID from header
    if (!user) {
      const userIdFromHeader = request.headers.get('x-user-id');
      if (userIdFromHeader) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an event manager
    let userRole: string | undefined = (user as any).role;

    if (!userRole) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData) {
        userRole = userData.role;
      }
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

    // Fetch ONLY team members from team_members table (not invitations)
    const { data: activeMembers, error: activeMembersError } =
      await supabaseAdmin
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

    if (activeMembersError) {
      console.error('Error fetching team members:', activeMembersError);
      return NextResponse.json(
        {
          error: 'Failed to fetch team members',
          details: activeMembersError.message,
        },
        { status: 500 }
      );
    }

    // Fetch user details for team members
    let teamMemberDetails: any[] = [];
    if (activeMembers && activeMembers.length > 0) {
      const teamMemberIds = activeMembers.map(m => m.team_member_id);

      // Fetch users
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', teamMemberIds);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name, phone, avatar_url')
        .in('user_id', teamMemberIds);

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
      }
    }

    // Format the data (ONLY team members, no invitations)
    const teamMembers = [];
    if (teamMemberDetails && teamMemberDetails.length > 0) {
      for (const member of teamMemberDetails) {
        const userData = member.userData;
        const profile = userData?.profile;

        teamMembers.push({
          id: member.id, // This is team_members.id - valid for event assignment
          name: profile
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : userData?.email || 'Unknown',
          role: member.role,
          email: userData?.email || '',
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          status: member.status,
        });
      }
    }

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    console.error('Error fetching team members for events:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team members',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
