import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/invitations/pending
// Returns pending event invitations for the current contractor user
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

    // Fetch pending invitations from event_contractors
    const { data: pendingInvitations, error: invError } = await supabaseAdmin
      .from('event_contractors')
      .select('id, event_id, created_at, added_by')
      .eq('contractor_id', user.id)
      .eq('status', 'invited')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('[PendingInvitations] Error fetching:', invError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    if (!pendingInvitations || pendingInvitations.length === 0) {
      return NextResponse.json({ invitations: [] });
    }

    // Gather event IDs and manager IDs
    const eventIds = pendingInvitations.map((inv: any) => inv.event_id);
    const managerIds = [
      ...new Set(pendingInvitations.map((inv: any) => inv.added_by)),
    ];

    // Fetch event details and manager profiles in parallel
    const [eventsResult, managersResult] = await Promise.all([
      supabaseAdmin
        .from('events')
        .select('id, title, event_date, event_type')
        .in('id', eventIds),
      supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', managerIds),
    ]);

    const eventMap = new Map(
      (eventsResult.data || []).map((e: any) => [e.id, e])
    );
    const managerMap = new Map(
      (managersResult.data || []).map((m: any) => [
        m.user_id,
        `${m.first_name} ${m.last_name}`.trim(),
      ])
    );

    // Find the corresponding enquiry_messages for each invitation so the
    // frontend can call the respond-invitation endpoint
    // Match by: metadata->type = 'event_invitation', metadata->contractor_user_id = user.id,
    // metadata->event_id = event_id, and metadata->status IS NULL (not yet responded)
    const { data: invitationMessages } = await supabaseAdmin
      .from('enquiry_messages')
      .select('id, enquiry_id, metadata')
      .eq('is_system', true)
      .eq('response_type', 'system')
      .filter('metadata->>type', 'eq', 'event_invitation')
      .filter('metadata->>contractor_user_id', 'eq', user.id)
      .is('metadata->>status', null);

    // Build a map: event_id -> { messageId, enquiryId }
    const messageMap = new Map<
      string,
      { messageId: string; enquiryId: string }
    >();
    for (const msg of invitationMessages || []) {
      const meta = msg.metadata as any;
      if (meta?.event_id && !messageMap.has(meta.event_id)) {
        messageMap.set(meta.event_id, {
          messageId: msg.id,
          enquiryId: msg.enquiry_id,
        });
      }
    }

    // Build response
    const invitations = pendingInvitations
      .map((inv: any) => {
        const event = eventMap.get(inv.event_id);
        const msgInfo = messageMap.get(inv.event_id);

        if (!event || !msgInfo) return null;

        return {
          id: inv.id,
          eventId: inv.event_id,
          eventTitle: event.title,
          eventDate: event.event_date,
          eventType: event.event_type,
          managerName: managerMap.get(inv.added_by) || 'an event manager',
          enquiryId: msgInfo.enquiryId,
          messageId: msgInfo.messageId,
          createdAt: inv.created_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in GET /api/invitations/pending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
