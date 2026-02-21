import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/inquiries/[id]/messages/[messageId]/respond-invitation
// Body: { action: 'accept' | 'decline' }
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; messageId: string }>
      | { id: string; messageId: string };
  }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;
    const messageId = resolvedParams.messageId;

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

    const body = await request.json();
    const { action } = body;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Fetch the message and its metadata
    const { data: message, error: msgError } = await supabaseAdmin
      .from('enquiry_messages')
      .select('id, enquiry_id, metadata, message')
      .eq('id', messageId)
      .eq('enquiry_id', inquiryId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const metadata = message.metadata as {
      type?: string;
      event_id?: string;
      contractor_user_id?: string;
      status?: string;
    } | null;

    if (!metadata || metadata.type !== 'event_invitation') {
      return NextResponse.json(
        { success: false, error: 'This message is not an invitation' },
        { status: 400 }
      );
    }

    if (metadata.status === 'accepted' || metadata.status === 'declined') {
      return NextResponse.json(
        {
          success: false,
          error: 'This invitation has already been responded to',
        },
        { status: 400 }
      );
    }

    // Verify the current user is the contractor being invited
    if (metadata.contractor_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the invited contractor can respond' },
        { status: 403 }
      );
    }

    const eventId = metadata.event_id;
    const newStatus = action === 'accept' ? 'confirmed' : 'declined';

    // Update event_contractors status
    const { error: updateError } = await supabaseAdmin
      .from('event_contractors')
      .update({ status: newStatus })
      .eq('event_id', eventId)
      .eq('contractor_id', metadata.contractor_user_id);

    if (updateError) {
      console.error(
        '[InvitationResponse] Failed to update event_contractors:',
        updateError
      );
      return NextResponse.json(
        { success: false, error: 'Failed to update invitation status' },
        { status: 500 }
      );
    }

    // Update the message metadata to record the response
    await supabaseAdmin
      .from('enquiry_messages')
      .update({
        metadata: {
          ...metadata,
          status: action === 'accept' ? 'accepted' : 'declined',
        },
      })
      .eq('id', messageId);

    // Fetch contractor name for the response system message
    const { data: contractorProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const contractorName = contractorProfile
      ? `${contractorProfile.first_name} ${contractorProfile.last_name}`.trim()
      : 'The contractor';

    // Fetch event title
    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    const eventTitle = eventData?.title || 'the event';

    const responseMessage =
      action === 'accept'
        ? `${contractorName} has accepted the invitation to join "${eventTitle}"`
        : `${contractorName} has declined the invitation to join "${eventTitle}"`;

    // Insert response system message
    await supabaseAdmin.from('enquiry_messages').insert({
      enquiry_id: inquiryId,
      sender_id: user.id,
      message: responseMessage,
      is_read: false,
      response_type: 'system',
      is_system: true,
      metadata: {
        type: 'event_invitation_response',
        event_id: eventId,
        action,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error in POST respond-invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
