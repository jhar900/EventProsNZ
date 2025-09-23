import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  GetEventNotificationsRequest,
  EventNotificationResponse,
} from '@/types/events';

// Validation schemas
const getNotificationsSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  contractorId: z.string().uuid().optional(),
  isRead: z.coerce.boolean().optional(),
});

// GET /api/events/[id]/notifications - Get event notifications
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getNotificationsSchema.safeParse({
      eventId,
      ...queryParams,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { contractorId, isRead } = validationResult.data;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions - user must be event manager or contractor
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    const isEventManager = event.event_manager_id === user.id;
    const isAdmin = userProfile.role === 'admin';
    const isContractor = userProfile.role === 'contractor';

    if (!isEventManager && !isAdmin && !isContractor) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('event_notifications')
      .select(
        `
        *,
        events!event_notifications_event_id_fkey (
          title,
          event_date
        ),
        profiles!event_notifications_contractor_id_fkey (
          first_name,
          last_name
        )
      `
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    // Apply filters based on user role
    if (isContractor && !isAdmin) {
      // Contractors can only see their own notifications
      query = query.eq('contractor_id', user.id);
    } else if (contractorId) {
      // Event managers and admins can filter by contractor
      query = query.eq('contractor_id', contractorId);
    }

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    const response: EventNotificationResponse = {
      notifications: notifications || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/events/[id]/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/notifications - Mark notifications as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Parse request body
    const body = await request.json();
    const { notificationIds, isRead = true } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    const isEventManager = event.event_manager_id === user.id;
    const isAdmin = userProfile.role === 'admin';
    const isContractor = userProfile.role === 'contractor';

    if (!isEventManager && !isAdmin && !isContractor) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update query
    let updateQuery = supabase
      .from('event_notifications')
      .update({ is_read: isRead })
      .in('id', notificationIds)
      .eq('event_id', eventId);

    // Contractors can only update their own notifications
    if (isContractor && !isAdmin) {
      updateQuery = updateQuery.eq('contractor_id', user.id);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notifications marked as ${isRead ? 'read' : 'unread'}`,
    });
  } catch (error) {
    console.error('Error in PUT /api/events/[id]/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
