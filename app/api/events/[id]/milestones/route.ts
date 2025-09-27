import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createMilestoneSchema = z.object({
  milestone_name: z.string().min(1, 'Milestone name is required'),
  milestone_date: z.string().datetime('Invalid date format'),
  description: z.string().optional(),
});

const updateMilestoneSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  description: z.string().optional(),
});

// GET /api/events/[id]/milestones - Get event milestones
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

    // Get milestones for this event
    const { data: milestones, error: milestonesError } = await supabase
      .from('event_milestones')
      .select('*')
      .eq('event_id', eventId)
      .order('milestone_date', { ascending: true });

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      milestones: milestones || [],
      success: true,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/milestones:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/milestones - Create milestone
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
    const validationResult = createMilestoneSchema.safeParse(body);

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

    const { milestone_name, milestone_date, description } =
      validationResult.data;

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

    // Create milestone
    const { data: milestone, error: createError } = await supabase
      .from('event_milestones')
      .insert({
        event_id: eventId,
        milestone_name,
        milestone_date,
        description,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating milestone:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create milestone' },
        { status: 500 }
      );
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
        notification_type: 'milestone_created',
        message: `New milestone "${milestone_name}" has been added to the event`,
      }));

      const { error: notificationError } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
    }

    return NextResponse.json({
      milestone,
      success: true,
      message: 'Milestone created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/milestones:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/milestones/[milestone_id] - Update milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; milestone_id: string } }
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
    const milestoneId = params.milestone_id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateMilestoneSchema.safeParse(body);

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

    const { status, description } = validationResult.data;

    // Check if milestone exists and user has access
    const { data: milestone, error: milestoneError } = await supabase
      .from('event_milestones')
      .select(
        `
        *,
        events!inner (
          event_manager_id
        )
      `
      )
      .eq('id', milestoneId)
      .eq('event_id', eventId)
      .single();

    if (milestoneError) {
      if (milestoneError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Milestone not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching milestone:', milestoneError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch milestone' },
        { status: 500 }
      );
    }

    // Check permissions
    if (milestone.events.event_manager_id !== user.id) {
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

    // Update milestone
    const updateData: any = {};
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const { data: updatedMilestone, error: updateError } = await supabase
      .from('event_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating milestone:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update milestone' },
        { status: 500 }
      );
    }

    // Create notification for contractors if milestone is completed
    if (status === 'completed') {
      const { data: contractors } = await supabase
        .from('event_contractor_matches')
        .select('contractor_id')
        .eq('event_id', eventId)
        .eq('status', 'accepted');

      if (contractors && contractors.length > 0) {
        const notifications = contractors.map(contractor => ({
          event_id: eventId,
          contractor_id: contractor.contractor_id,
          notification_type: 'milestone_completed',
          message: `Milestone "${milestone.milestone_name}" has been completed`,
        }));

        const { error: notificationError } = await supabase
          .from('event_notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      }
    }

    return NextResponse.json({
      milestone: updatedMilestone,
      success: true,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/events/[id]/milestones/[milestone_id]:',
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
