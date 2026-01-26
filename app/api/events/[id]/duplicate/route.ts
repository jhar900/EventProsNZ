import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const duplicateEventSchema = z.object({
  new_title: z.string().min(1, 'New title is required'),
  new_date: z.string().datetime('Invalid date format'),
  changes: z.record(z.any()).optional(),
});

// POST /api/events/[id]/duplicate - Duplicate an event
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
    const validationResult = duplicateEventSchema.safeParse(body);

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

    const { new_title, new_date, changes } = validationResult.data;

    // Get original event with all related data
    const { data: originalEvent, error: eventError } = await supabase
      .from('events')
      .select(
        `
        *,
        event_service_requirements (*)
      `
      )
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    if (originalEvent.event_manager_id !== user.id) {
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

    // Prepare duplicated event data
    const duplicatedEventData = {
      event_manager_id: user.id,
      title: new_title,
      description: originalEvent.description,
      event_date: new_date,
      event_type: originalEvent.event_type,
      duration_hours: originalEvent.duration_hours,
      attendee_count: originalEvent.attendee_count,
      location: originalEvent.location,
      location_data: originalEvent.location_data,
      requirements: originalEvent.requirements,
      budget_total: originalEvent.budget_total,
      budget_min: originalEvent.budget_min,
      budget_max: originalEvent.budget_max,
      status: 'draft' as const, // Always start duplicated events as draft
    };

    // Apply any custom changes
    if (changes) {
      Object.assign(duplicatedEventData, changes);
    }

    // Create duplicated event
    const { data: duplicatedEvent, error: createError } = await supabase
      .from('events')
      .insert(duplicatedEventData)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { success: false, message: 'Failed to create duplicated event' },
        { status: 500 }
      );
    }

    // Duplicate service requirements if they exist
    if (
      originalEvent.event_service_requirements &&
      originalEvent.event_service_requirements.length > 0
    ) {
      const serviceRequirements = originalEvent.event_service_requirements.map(
        req => ({
          event_id: duplicatedEvent.id,
          service_category: req.service_category,
          service_type: req.service_type,
          description: req.description,
          priority: req.priority,
          estimated_budget: req.estimated_budget,
          is_required: req.is_required,
        })
      );

      const { error: serviceError } = await supabase
        .from('event_service_requirements')
        .insert(serviceRequirements);

      if (serviceError) {
        // Don't fail the entire request, just log the error
      }
    }

    // Create initial version record for the duplicated event
    const { error: versionError } = await supabase
      .from('event_versions')
      .insert({
        event_id: duplicatedEvent.id,
        version_number: 1,
        changes: {
          action: 'duplicated',
          original_event_id: eventId,
          changes: changes || {},
        },
        created_by: user.id,
      });

    if (versionError) {
      // Don't fail the entire request
    }

    return NextResponse.json({
      duplicated_event: duplicatedEvent,
      success: true,
      message: 'Event duplicated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/duplicates - Get duplicates of an event
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

    // Check if original event exists and user has access
    const { data: originalEvent, error: eventError } = await supabase
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
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    if (originalEvent.event_manager_id !== user.id) {
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

    // Find duplicates by looking for events with similar titles and same event manager
    const { data: duplicates, error: duplicatesError } = await supabase
      .from('events')
      .select(
        `
        *,
        event_versions!inner (
          changes
        )
      `
      )
      .eq('event_manager_id', originalEvent.event_manager_id)
      .neq('id', eventId)
      .order('created_at', { ascending: false });

    if (duplicatesError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch duplicates' },
        { status: 500 }
      );
    }

    // Filter for actual duplicates (events created from this one)
    const actualDuplicates =
      duplicates?.filter(event => {
        const version = event.event_versions?.[0];
        return (
          version?.changes?.action === 'duplicated' &&
          version?.changes?.original_event_id === eventId
        );
      }) || [];

    return NextResponse.json({
      duplicates: actualDuplicates,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
