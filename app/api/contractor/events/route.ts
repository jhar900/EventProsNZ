import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/contractor/events
// Returns events where the current contractor has been confirmed
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user
    let user: any;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      const {
        data: { user: getUserUser },
      } = await supabase.auth.getUser();
      if (getUserUser) {
        user = getUserUser;
      }
    }

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
            email: userData.email,
            role: userData.role,
          };
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contractor's event assignments (confirmed only)
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('event_contractors')
      .select('id, event_id, role, notes, status, created_at, added_by')
      .eq('contractor_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (assignError) {
      console.error(
        '[ContractorEvents] Error fetching assignments:',
        assignError
      );
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Fetch event details and manager profiles in parallel
    const eventIds = assignments.map((a: any) => a.event_id);
    const managerIds = [
      ...new Set(assignments.map((a: any) => a.added_by).filter(Boolean)),
    ];

    const [eventsResult, managersResult] = await Promise.all([
      supabaseAdmin
        .from('events')
        .select(
          'id, title, description, event_date, event_type, status, location, duration_hours, attendee_count'
        )
        .in('id', eventIds),
      managerIds.length > 0
        ? supabaseAdmin
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', managerIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch business profiles for manager companies
    const { data: managerBizProfiles } =
      managerIds.length > 0
        ? await supabaseAdmin
            .from('business_profiles')
            .select('user_id, company_name')
            .in('user_id', managerIds)
        : { data: [] };

    const eventMap = new Map(
      (eventsResult.data || []).map((e: any) => [e.id, e])
    );
    const bizMap = new Map(
      (managerBizProfiles || []).map((bp: any) => [bp.user_id, bp.company_name])
    );
    const managerMap = new Map(
      (managersResult.data || []).map((m: any) => [
        m.user_id,
        {
          name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          company: bizMap.get(m.user_id) || null,
        },
      ])
    );

    // Build response
    const events = assignments
      .map((assignment: any) => {
        const event = eventMap.get(assignment.event_id);
        if (!event) return null;

        const manager = managerMap.get(assignment.added_by) || {
          name: 'Unknown',
          company: null,
        };

        return {
          id: assignment.id,
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventDate: event.event_date,
          eventType: event.event_type,
          eventStatus: event.status,
          location: event.location,
          durationHours: event.duration_hours,
          attendeeCount: event.attendee_count,
          role: assignment.role,
          notes: assignment.notes,
          managerName: manager.name,
          managerCompany: manager.company,
          assignedAt: assignment.created_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/contractor/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
