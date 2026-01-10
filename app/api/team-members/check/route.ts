import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get('x-user-id');

    // If no userId in header, try to get from session
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        userId = session.user.id;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Use admin client to check team member status
    const adminSupabase = createServerClient();

    // Check if user is a team member (has a record in team_members table)
    const { data: teamMember, error: teamMemberError } = await adminSupabase
      .from('team_members')
      .select('id')
      .eq('team_member_id', userId)
      .in('status', ['invited', 'onboarding', 'active'])
      .maybeSingle();

    if (teamMemberError) {
      console.error('Error checking team member status:', teamMemberError);
      return NextResponse.json(
        { error: 'Failed to check team member status' },
        { status: 500 }
      );
    }

    // Also check if user has a pending invitation (in case they just signed up)
    let hasPendingInvitation = false;
    if (!teamMember) {
      // Get user email to check for pending invitations
      const { data: userData } = await adminSupabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userData?.email) {
        const { data: invitation } = await adminSupabase
          .from('team_member_invitations')
          .select('id')
          .eq('email', userData.email)
          .eq('status', 'invited')
          .maybeSingle();

        hasPendingInvitation = !!invitation;
      }
    }

    return NextResponse.json({
      isTeamMember: !!teamMember || hasPendingInvitation,
    });
  } catch (error) {
    console.error('Error in team member check:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
