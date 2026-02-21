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

      // Create system messages for removals (best-effort, non-blocking)
      try {
        const { data: bp } = await supabaseAdmin
          .from('business_profiles')
          .select('id, company_name')
          .eq('user_id', contractorId)
          .maybeSingle();

        if (bp) {
          const { data: contractorProfile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', contractorId)
            .maybeSingle();

          const contractorName = contractorProfile
            ? `${contractorProfile.first_name} ${contractorProfile.last_name}`.trim()
            : 'a contractor';
          const companyName = bp.company_name || 'their company';

          // Fetch event manager's name for contractor-facing messages
          const { data: rmManagerProfile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle();

          const rmManagerName = rmManagerProfile
            ? `${rmManagerProfile.first_name} ${rmManagerProfile.last_name}`.trim()
            : 'the event manager';

          const { data: eventDetails } = await supabaseAdmin
            .from('events')
            .select('id, title')
            .in('id', toRemove);

          const eventTitleMap = new Map(
            (eventDetails || []).map((e: any) => [e.id, e.title])
          );

          // Find existing conversation between this user and contractor
          const { data: existingEnquiry } = await supabaseAdmin
            .from('enquiries')
            .select('id')
            .eq('contractor_id', bp.id)
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingEnquiry) {
            for (const eventId of toRemove) {
              const eventTitle = eventTitleMap.get(eventId) || 'Untitled Event';

              await supabaseAdmin.from('enquiry_messages').insert({
                enquiry_id: existingEnquiry.id,
                sender_id: user.id,
                message: `You have removed ${contractorName} from ${companyName} from "${eventTitle}"`,
                is_read: false,
                response_type: 'system',
                is_system: true,
                metadata: {
                  type: 'event_removal',
                  event_id: eventId,
                  contractor_message: `You have been removed by ${rmManagerName} from "${eventTitle}" as a contractor`,
                },
              });
            }
          }
        }
      } catch (systemMsgError) {
        console.error(
          '[SystemMsg] Error creating removal system messages:',
          systemMsgError
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

      // Create system messages in conversation threads (best-effort, non-blocking)
      try {
        // contractorId from URL is a users.id — resolve to business_profiles.id
        const { data: bp } = await supabaseAdmin
          .from('business_profiles')
          .select('id, company_name')
          .eq('user_id', contractorId)
          .maybeSingle();

        if (!bp) {
          console.warn(
            `[SystemMsg] No business profile for user ${contractorId}, skipping system messages`
          );
        } else {
          const bpId = bp.id;

          // Fetch contractor's personal name from profiles
          const { data: contractorProfile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', contractorId)
            .maybeSingle();

          const contractorName = contractorProfile
            ? `${contractorProfile.first_name} ${contractorProfile.last_name}`.trim()
            : 'a contractor';
          const companyName = bp.company_name || 'their company';

          // Fetch event manager's name for contractor-facing messages
          const { data: managerProfile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle();

          const managerName = managerProfile
            ? `${managerProfile.first_name} ${managerProfile.last_name}`.trim()
            : 'the event manager';

          // Fetch event titles for the newly linked events
          const { data: eventDetails } = await supabaseAdmin
            .from('events')
            .select('id, title')
            .in('id', toAdd);

          const eventTitleMap = new Map(
            (eventDetails || []).map((e: any) => [e.id, e.title])
          );

          // Find any existing conversation between this user and contractor
          const { data: existingEnquiry } = await supabaseAdmin
            .from('enquiries')
            .select('id')
            .eq('contractor_id', bpId)
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let enquiryId: string;

          if (existingEnquiry) {
            enquiryId = existingEnquiry.id;
          } else {
            // No conversation exists — create one for the first event being linked
            const firstEventTitle =
              eventTitleMap.get(toAdd[0]) || 'Untitled Event';
            const { data: newEnquiry, error: enquiryError } =
              await supabaseAdmin
                .from('enquiries')
                .insert({
                  event_id: toAdd[0],
                  contractor_id: bpId,
                  sender_id: user.id,
                  subject: `Team Assignment: ${firstEventTitle}`,
                  message: `You have invited ${contractorName} from ${companyName} to join "${firstEventTitle}" as a contractor`,
                  status: 'pending',
                })
                .select('id')
                .single();

            if (enquiryError || !newEnquiry) {
              console.error(
                `[SystemMsg] Failed to create enquiry:`,
                enquiryError
              );
            } else {
              enquiryId = newEnquiry.id;
            }
          }

          // Insert system messages into the conversation thread
          if (enquiryId!) {
            for (const eventId of toAdd) {
              const eventTitle = eventTitleMap.get(eventId) || 'Untitled Event';

              const { error: msgError } = await supabaseAdmin
                .from('enquiry_messages')
                .insert({
                  enquiry_id: enquiryId,
                  sender_id: user.id,
                  message: `You have invited ${contractorName} from ${companyName} to join "${eventTitle}" as a contractor`,
                  is_read: false,
                  response_type: 'system',
                  is_system: true,
                  metadata: {
                    type: 'event_invitation',
                    event_id: eventId,
                    contractor_user_id: contractorId,
                    contractor_message: `You have been invited by ${managerName} to join "${eventTitle}" as a contractor`,
                  },
                });

              if (msgError) {
                console.error(
                  `[SystemMsg] Failed to insert message for event ${eventId}:`,
                  msgError
                );
              }
            }
          }
        }
      } catch (systemMsgError) {
        console.error(
          '[SystemMsg] Error creating system messages:',
          systemMsgError
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
