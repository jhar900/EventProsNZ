import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createFeedbackSchema = z.object({
  contractor_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

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
