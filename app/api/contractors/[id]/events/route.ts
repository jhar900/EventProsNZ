import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch events for a contractor (linked events + available events for the user)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: contractorId } = params;
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

    // Fetch user's owned events (excluding drafts)
    const { data: ownedEvents, error: ownedEventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, event_date, event_type, status')
      .eq('user_id', user.id)
      .neq('status', 'draft')
      .order('event_date', { ascending: false });

    if (ownedEventsError) {
      console.error('Error fetching owned events:', ownedEventsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Fetch events where user is a team member
    // First get team_member records for this user
    const { data: teamMemberRecords } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_member_id', user.id)
      .in('status', ['active', 'onboarding']);

    const teamMemberIds = (teamMemberRecords || []).map((tm: any) => tm.id);

    let teamMemberEvents: any[] = [];
    if (teamMemberIds.length > 0) {
      // Get event IDs where user is assigned as team member
      const { data: eventTeamMemberRecords } = await supabaseAdmin
        .from('event_team_members')
        .select('event_id')
        .in('team_member_id', teamMemberIds);

      const eventIdsFromTeamMembership = (eventTeamMemberRecords || []).map(
        (etm: any) => etm.event_id
      );

      if (eventIdsFromTeamMembership.length > 0) {
        const { data: tmEvents } = await supabaseAdmin
          .from('events')
          .select('id, title, event_date, event_type, status')
          .in('id', eventIdsFromTeamMembership)
          .neq('status', 'draft')
          .order('event_date', { ascending: false });

        teamMemberEvents = tmEvents || [];
      }
    }

    // Combine and deduplicate events
    const allEvents = [...(ownedEvents || []), ...teamMemberEvents].filter(
      (event, index, self) => index === self.findIndex(e => e.id === event.id)
    );

    // Sort by event_date descending
    allEvents.sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
      return dateB - dateA;
    });

    const events = allEvents;

    // Fetch existing contractor-event links from event_contractors table
    const { data: existingLinks, error: linksError } = await supabaseAdmin
      .from('event_contractors')
      .select('event_id, status')
      .eq('contractor_id', contractorId);

    if (linksError) {
      console.error('Error fetching contractor links:', linksError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contractor links' },
        { status: 500 }
      );
    }

    const linkedEventIds = (existingLinks || []).map(
      (link: any) => link.event_id
    );

    return NextResponse.json({
      success: true,
      events: events || [],
      linkedEventIds,
    });
  } catch (error) {
    console.error('Error in GET /api/contractors/[id]/events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update contractor-event links
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: contractorId } = params;
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

    const body = await request.json();
    const { eventIds } = body;

    if (!Array.isArray(eventIds)) {
      return NextResponse.json(
        { success: false, error: 'eventIds must be an array' },
        { status: 400 }
      );
    }

    // Get all events user has access to (owned + team member)
    const { data: ownedEvents } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('user_id', user.id);

    const ownedEventIds = (ownedEvents || []).map((e: any) => e.id);

    // Get events where user is a team member
    const { data: teamMemberRecords } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_member_id', user.id)
      .in('status', ['active', 'onboarding']);

    const teamMemberIds = (teamMemberRecords || []).map((tm: any) => tm.id);

    let teamMemberEventIds: string[] = [];
    if (teamMemberIds.length > 0) {
      const { data: eventTeamMemberRecords } = await supabaseAdmin
        .from('event_team_members')
        .select('event_id')
        .in('team_member_id', teamMemberIds);

      teamMemberEventIds = (eventTeamMemberRecords || []).map(
        (etm: any) => etm.event_id
      );
    }

    // Combine all accessible event IDs
    const accessibleEventIds = [
      ...new Set([...ownedEventIds, ...teamMemberEventIds]),
    ];

    // Verify user has access to all the events they're trying to link
    if (eventIds.length > 0) {
      const unauthorizedEvents = eventIds.filter(
        (id: string) => !accessibleEventIds.includes(id)
      );

      if (unauthorizedEvents.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to link some events' },
          { status: 403 }
        );
      }
    }

    const userEventIdsList = accessibleEventIds;

    // Get existing links for this contractor within user's events
    const { data: existingLinks } = await supabaseAdmin
      .from('event_contractors')
      .select('event_id')
      .eq('contractor_id', contractorId)
      .in('event_id', userEventIdsList);

    const existingEventIds = (existingLinks || []).map(
      (link: any) => link.event_id
    );

    // Determine what to add and remove
    const toAdd = eventIds.filter(
      (id: string) => !existingEventIds.includes(id)
    );
    const toRemove = existingEventIds.filter(
      (id: string) => !eventIds.includes(id)
    );

    // Remove unselected links
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('event_contractors')
        .delete()
        .eq('contractor_id', contractorId)
        .in('event_id', toRemove);

      if (deleteError) {
        console.error('Error removing contractor links:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to update contractor links' },
          { status: 500 }
        );
      }
    }

    // Add new links
    if (toAdd.length > 0) {
      const newLinks = toAdd.map((eventId: string) => ({
        event_id: eventId,
        contractor_id: contractorId,
        status: 'invited',
        added_by: user.id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('event_contractors')
        .insert(newLinks);

      if (insertError) {
        console.error('Error adding contractor links:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to add contractor links' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error('Error in PUT /api/contractors/[id]/events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
