import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const completeEventSchema = z.object({
  completion_data: z.record(z.any()),
  feedback: z.string().optional(),
});

const createFeedbackSchema = z.object({
  contractor_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

// POST /api/events/[id]/completion - Complete an event
export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = completeEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { completion_data, feedback } = validationResult.data;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id, status')
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
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Check if event can be completed
    if (event.status !== 'in_progress') {
      return NextResponse.json(
        {
          success: false,
          message: 'Event must be in progress to be completed',
        },
        { status: 400 }
      );
    }

    // Update event status to completed
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
        status: 'completed',
        // Store completion data in a JSON field if needed
        // completion_data: completion_data
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to complete event' },
        { status: 500 }
      );
    }

    // Create status history record
    const { error: historyError } = await supabase
      .from('event_status_history')
      .insert({
        event_id: eventId,
        previous_status: event.status,
        new_status: 'completed',
        changed_by: user.id,
        reason: feedback || 'Event completed',
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
    }

    // Create notification for contractors
    const { data: contractors } = await supabase
      .from('event_contractor_matches')
      .select('contractor_id')
      .eq('event_id', eventId)
      .eq('status', 'accepted');

    if (contractors && contractors.length > 0) {
      const notifications = contractors.map(contractor => ({
        event_id: eventId,
        contractor_id: contractor.contractor_id,
        notification_type: 'event_completed',
        message:
          'The event has been completed. Thank you for your participation!',
      }));

      const { error: notificationError } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
    }

    return NextResponse.json({
      event: updatedEvent,
      success: true,
      message: 'Event completed successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/completion:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/feedback - Get event feedback
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

    // Check permissions
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get feedback for this event
    const { data: feedback, error: feedbackError } = await supabase
      .from('event_feedback')
      .select(
        `
        *,
        profiles!event_feedback_contractor_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: feedback || [],
      success: true,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/feedback:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/feedback - Create feedback
export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createFeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { contractor_id, rating, feedback } = validationResult.data;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id, status')
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

    // Check permissions - only event manager or admin can create feedback
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Check if feedback already exists for this contractor and event
    const { data: existingFeedback } = await supabase
      .from('event_feedback')
      .select('id')
      .eq('event_id', eventId)
      .eq('contractor_id', contractor_id)
      .single();

    if (existingFeedback) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feedback already exists for this contractor',
        },
        { status: 400 }
      );
    }

    // Create feedback
    const { data: newFeedback, error: createError } = await supabase
      .from('event_feedback')
      .insert({
        event_id: eventId,
        contractor_id,
        rating,
        feedback,
      })
      .select(
        `
        *,
        profiles!event_feedback_contractor_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .single();

    if (createError) {
      console.error('Error creating feedback:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: newFeedback,
      success: true,
      message: 'Feedback created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/feedback:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
