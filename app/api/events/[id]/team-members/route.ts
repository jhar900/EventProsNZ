import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch team members assigned to an event
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

    // Fetch event to verify ownership
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify user owns the event or is an admin
    if (event.user_id !== user.id && (user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to view this event' },
        { status: 403 }
      );
    }

    // Fetch event team members with team member details
    const { data: eventTeamMembers, error: eventTeamMembersError } =
      await supabaseAdmin
        .from('event_team_members')
        .select(
          `
          id,
          event_id,
          team_member_id,
          created_at,
          team_members:team_member_id (
            id,
            role,
            status,
            team_member_id,
            users:team_member_id (
              id,
              email,
              profiles (
                first_name,
                last_name,
                phone,
                avatar_url
              )
            )
          )
        `
        )
        .eq('event_id', eventId);

    if (eventTeamMembersError) {
      // Check if the error is because the table doesn't exist
      if (
        eventTeamMembersError.code === '42P01' ||
        eventTeamMembersError.message?.includes('does not exist')
      ) {
        console.error(
          'event_team_members table does not exist. Please run the migration.'
        );
        return NextResponse.json(
          {
            error:
              'Database table not found. Please run the migration to create event_team_members table.',
            details: eventTeamMembersError.message,
          },
          { status: 500 }
        );
      }
      console.error(
        'Error fetching event team members:',
        eventTeamMembersError
      );
      return NextResponse.json(
        {
          error: 'Failed to fetch event team members',
          details: eventTeamMembersError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to a more usable format
    const teamMembers = (eventTeamMembers || []).map((etm: any) => {
      const teamMember = etm.team_members;
      const user = teamMember?.users;
      const profile = Array.isArray(user?.profiles)
        ? user.profiles[0]
        : user?.profiles;

      return {
        id: etm.id,
        eventId: etm.event_id,
        teamMemberId: etm.team_member_id,
        name: profile
          ? `${profile.first_name} ${profile.last_name}`.trim()
          : user?.email || 'Unknown',
        role: teamMember?.role || 'N/A',
        email: user?.email || 'N/A',
        phone: profile?.phone || 'N/A',
        status: teamMember?.status || 'N/A',
        avatarUrl: profile?.avatar_url || null,
      };
    });

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/team-members:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Add team members to an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { supabase } = createClient(request);
    const body = await request.json();
    const { teamMemberIds } = body;

    if (!Array.isArray(teamMemberIds) || teamMemberIds.length === 0) {
      return NextResponse.json(
        { error: 'teamMemberIds must be a non-empty array' },
        { status: 400 }
      );
    }

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

    // Fetch event to verify ownership
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify user owns the event or is an admin
    if (event.user_id !== user.id && (user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Verify all team members belong to the event manager
    const { data: teamMembers, error: teamMembersError } = await supabaseAdmin
      .from('team_members')
      .select('id, event_manager_id')
      .in('id', teamMemberIds);

    if (teamMembersError) {
      console.error('Error verifying team members:', teamMembersError);
      console.error('Team member IDs:', teamMemberIds);
      return NextResponse.json(
        {
          error: 'Failed to verify team members',
          details: teamMembersError.message,
          code: teamMembersError.code,
        },
        { status: 500 }
      );
    }

    // Check if any team members were found
    if (!teamMembers || teamMembers.length === 0) {
      console.error('No team members found for IDs:', teamMemberIds);
      return NextResponse.json(
        { error: 'No team members found with the provided IDs' },
        { status: 404 }
      );
    }

    // Check if all provided IDs were found
    if (teamMembers.length !== teamMemberIds.length) {
      const foundIds = new Set(teamMembers.map(tm => tm.id));
      const missingIds = teamMemberIds.filter(id => !foundIds.has(id));
      console.error('Some team member IDs not found:', missingIds);
      return NextResponse.json(
        {
          error: 'Some team member IDs were not found',
          missingIds,
        },
        { status: 404 }
      );
    }

    // Check if all team members belong to the event manager
    const invalidMembers = teamMembers?.filter(
      tm => tm.event_manager_id !== user.id
    );

    if (invalidMembers && invalidMembers.length > 0) {
      return NextResponse.json(
        { error: 'Some team members do not belong to you' },
        { status: 403 }
      );
    }

    // Check for existing assignments to avoid duplicates
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('event_team_members')
      .select('team_member_id')
      .eq('event_id', eventId)
      .in('team_member_id', teamMemberIds);

    if (existingError) {
      // Check if the error is because the table doesn't exist
      if (
        existingError.code === '42P01' ||
        existingError.message?.includes('does not exist')
      ) {
        console.error(
          'event_team_members table does not exist. Please run the migration.'
        );
        return NextResponse.json(
          {
            error:
              'Database table not found. Please run the migration to create event_team_members table.',
            details: existingError.message,
          },
          { status: 500 }
        );
      }
      console.error('Error checking existing assignments:', existingError);
      return NextResponse.json(
        {
          error: 'Failed to check existing assignments',
          details: existingError.message,
        },
        { status: 500 }
      );
    }

    const existingIds = new Set(
      (existing || []).map((e: any) => e.team_member_id)
    );
    const newTeamMemberIds = teamMemberIds.filter(id => !existingIds.has(id));

    if (newTeamMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All selected team members are already assigned to this event',
        added: 0,
      });
    }

    // Insert new event team member assignments
    const insertData = newTeamMemberIds.map(teamMemberId => ({
      event_id: eventId,
      team_member_id: teamMemberId,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('event_team_members')
      .insert(insertData)
      .select();

    if (insertError) {
      // Check if the error is because the table doesn't exist
      if (
        insertError.code === '42P01' ||
        insertError.message?.includes('does not exist')
      ) {
        console.error(
          'event_team_members table does not exist. Please run the migration.'
        );
        return NextResponse.json(
          {
            error:
              'Database table not found. Please run the migration to create event_team_members table.',
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 }
        );
      }
      console.error('Error inserting event team members:', insertError);
      console.error('Insert data:', insertData);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError.details);
      return NextResponse.json(
        {
          error: 'Failed to add team members to event',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${inserted.length} team member(s) to the event`,
      added: inserted.length,
      skipped: teamMemberIds.length - newTeamMemberIds.length,
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/team-members:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
