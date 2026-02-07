import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch contractors matched/assigned to an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
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

    // Fetch event to verify access
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is admin
    if ((user as any).role === 'admin') {
      // Admins have access to all events
    } else if (event.user_id === user.id) {
      // User owns the event
    } else {
      // Check if user is a team member of this event
      const { data: teamMemberRecords } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_member_id', user.id)
        .in('status', ['invited', 'active', 'onboarding']);

      const teamMemberIds = teamMemberRecords?.map(tm => tm.id) || [];

      if (teamMemberIds.length > 0) {
        const { data: eventTeamMemberRecords } = await supabaseAdmin
          .from('event_team_members')
          .select('id')
          .eq('event_id', eventId)
          .in('team_member_id', teamMemberIds)
          .limit(1);

        if (!eventTeamMemberRecords || eventTeamMemberRecords.length === 0) {
          return NextResponse.json(
            { error: 'Unauthorized to view this event' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unauthorized to view this event' },
          { status: 403 }
        );
      }
    }

    // Fetch contractors from event_contractor_matches (algorithmic matches)
    // Note: contractor_id in event_contractor_matches references users.id
    const { data: contractorMatches, error: matchesError } = await supabaseAdmin
      .from('event_contractor_matches')
      .select(
        `
        id,
        contractor_id,
        match_score,
        status,
        created_at
      `
      )
      .eq('event_id', eventId)
      .order('match_score', { ascending: false });

    if (matchesError) {
      console.error('Error fetching contractor matches:', matchesError);
    }

    // Fetch contractors from event_contractors (manual assignments/invites)
    const { data: manualAssignments, error: assignmentsError } =
      await supabaseAdmin
        .from('event_contractors')
        .select(
          `
        id,
        contractor_id,
        status,
        role,
        notes,
        added_by,
        created_at
      `
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching manual assignments:', assignmentsError);
    }

    // Collect all unique contractor IDs from both sources
    const matchedContractorIds = (contractorMatches || []).map(
      (m: any) => m.contractor_id
    );
    const assignedContractorIds = (manualAssignments || []).map(
      (a: any) => a.contractor_id
    );
    const allContractorUserIds = [
      ...new Set([...matchedContractorIds, ...assignedContractorIds]),
    ];

    // Fetch business profiles and user emails for all contractors
    const businessProfilesMap: Record<string, any> = {};
    const userEmailsMap: Record<string, string> = {};

    if (allContractorUserIds.length > 0) {
      // Fetch business profiles
      const { data: businessProfiles, error: profilesError } =
        await supabaseAdmin
          .from('business_profiles')
          .select('id, user_id, company_name, service_categories')
          .in('user_id', allContractorUserIds);

      if (!profilesError && businessProfiles) {
        businessProfiles.forEach((profile: any) => {
          businessProfilesMap[profile.user_id] = profile;
        });
      }

      // Fetch user emails
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', allContractorUserIds);

      if (!usersError && users) {
        users.forEach((u: any) => {
          userEmailsMap[u.id] = u.email;
        });
      }
    }

    // Build contractors map - manual assignments take priority over matches
    const contractorsMap: Record<string, any> = {};

    // First, add algorithmic matches
    (contractorMatches || []).forEach((match: any) => {
      const businessProfile = businessProfilesMap[match.contractor_id];
      contractorsMap[match.contractor_id] = {
        id: match.contractor_id,
        company_name: businessProfile?.company_name || 'Unknown',
        email: userEmailsMap[match.contractor_id] || 'N/A',
        service_categories: businessProfile?.service_categories || [],
        match_score: match.match_score || 0,
        status: match.status || 'pending',
        source: 'match',
      };
    });

    // Then, add/override with manual assignments (these take priority)
    (manualAssignments || []).forEach((assignment: any) => {
      const businessProfile = businessProfilesMap[assignment.contractor_id];
      const existing = contractorsMap[assignment.contractor_id];
      contractorsMap[assignment.contractor_id] = {
        id: assignment.contractor_id,
        company_name: businessProfile?.company_name || 'Unknown',
        email: userEmailsMap[assignment.contractor_id] || 'N/A',
        service_categories: businessProfile?.service_categories || [],
        match_score: existing?.match_score || 0,
        status: assignment.status || 'invited',
        role: assignment.role,
        notes: assignment.notes,
        source: 'assigned',
      };
    });

    // Convert map to array
    const contractors = Object.values(contractorsMap);

    return NextResponse.json({
      success: true,
      contractors,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/contractors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
