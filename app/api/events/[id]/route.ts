import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  UpdateEventRequest,
  EventCreationResponse,
  EVENT_TYPES,
  EVENT_STATUS,
} from '@/types/events';

// Validation schemas
const updateEventSchema = z.object({
  eventType: z
    .enum(Object.values(EVENT_TYPES) as [string, ...string[]])
    .optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  description: z.string().optional(),
  eventDate: z.string().datetime('Invalid date format').optional(),
  durationHours: z.number().min(1).max(168).optional(), // Max 1 week
  attendeeCount: z.number().min(1).max(10000).optional(),
  location: z
    .object({
      address: z.string().min(1, 'Address is required'),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      placeId: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  specialRequirements: z.string().optional(),
  serviceRequirements: z
    .array(
      z.object({
        id: z.string().optional(),
        category: z.string(),
        type: z.string(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']),
        estimatedBudget: z.number().min(0).optional(),
        isRequired: z.boolean(),
      })
    )
    .optional(),
  budgetPlan: z
    .object({
      totalBudget: z.number().min(0),
      breakdown: z.record(
        z.object({
          amount: z.number().min(0),
          percentage: z.number().min(0).max(100),
        })
      ),
      recommendations: z
        .array(
          z.object({
            category: z.string(),
            suggestedAmount: z.number().min(0),
            reason: z.string(),
            confidence: z.number().min(0).max(1),
          })
        )
        .optional()
        .default([]),
    })
    .optional(),
  status: z
    .enum(Object.values(EVENT_STATUS) as [string, ...string[]])
    .optional(),
});

// GET /api/events/[id] - Get a specific event with versions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    let user;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      user = { id: userId };
    } else {
      // Fallback to cookie-based auth
      const supabaseClient = await createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = supabaseClient;
      user = authUser;
      userId = authUser.id;
    }

    const eventId = params.id;

    // Get event with related data
    // Simplified query - just get event and service requirements
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
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
        {
          success: false,
          message: 'Failed to fetch event',
          error: eventError.message,
        },
        { status: 500 }
      );
    }

    // Get service requirements separately
    const { data: serviceRequirements, error: serviceError } = await supabase
      .from('event_service_requirements')
      .select('*')
      .eq('event_id', eventId);

    if (serviceError) {
      console.error('Error fetching service requirements:', serviceError);
      // Don't fail if service requirements can't be fetched, just log it
    }

    // Combine event with service requirements
    const eventWithRelations = {
      ...event,
      event_service_requirements: serviceRequirements || [],
    };

    // Check if user has access to this event
    // Events table uses user_id
    const eventOwnerId =
      eventWithRelations.user_id ||
      (eventWithRelations as any).event_manager_id;
    if (eventOwnerId !== user.id) {
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

    return NextResponse.json({
      event: eventWithRelations,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update a specific event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    let user;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      user = { id: userId };
    } else {
      // Fallback to cookie-based auth
      const supabaseClient = await createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = supabaseClient;
      user = authUser;
      userId = authUser.id;
    }

    const eventId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateEventSchema.safeParse(body);

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

    const updateData = validationResult.data;

    // Check if event exists and user has access
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id, event_manager_id, status')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
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

    // Check permissions - events table uses user_id
    const eventOwnerId =
      existingEvent.user_id || (existingEvent as any).event_manager_id;
    if (eventOwnerId !== user.id) {
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

    // Prepare update data
    const eventUpdateData: any = {};

    if (updateData.eventType) eventUpdateData.event_type = updateData.eventType;
    if (updateData.title) eventUpdateData.title = updateData.title;
    if (updateData.description !== undefined)
      eventUpdateData.description = updateData.description;
    if (updateData.eventDate) eventUpdateData.event_date = updateData.eventDate;
    if (updateData.durationHours)
      eventUpdateData.duration_hours = updateData.durationHours;
    if (updateData.attendeeCount)
      eventUpdateData.attendee_count = updateData.attendeeCount;
    if (updateData.location) {
      eventUpdateData.location = updateData.location.address;
      eventUpdateData.location_data = updateData.location;
    }
    if (updateData.specialRequirements !== undefined)
      eventUpdateData.special_requirements = updateData.specialRequirements;
    if (updateData.budgetPlan) {
      eventUpdateData.budget_total = updateData.budgetPlan.totalBudget;
      eventUpdateData.budget_min = updateData.budgetPlan.totalBudget * 0.8;
      eventUpdateData.budget_max = updateData.budgetPlan.totalBudget * 1.2;
    }
    if (updateData.status) eventUpdateData.status = updateData.status;

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(eventUpdateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to update event' },
        { status: 500 }
      );
    }

    // Update service requirements if provided
    if (updateData.serviceRequirements) {
      // Delete existing service requirements
      const { error: deleteError } = await supabase
        .from('event_service_requirements')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
      }

      // Insert new service requirements
      if (updateData.serviceRequirements.length > 0) {
        const serviceRequirements = updateData.serviceRequirements.map(req => ({
          event_id: eventId,
          service_category: req.category,
          service_type: req.type,
          description: req.description,
          priority: req.priority,
          estimated_budget: req.estimatedBudget,
          is_required: req.isRequired,
        }));

        const { error: serviceError } = await supabase
          .from('event_service_requirements')
          .insert(serviceRequirements);

        if (serviceError) {
        }
      }
    }

    const response: EventCreationResponse = {
      event: updatedEvent,
      success: true,
      message: 'Event updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete a specific event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    let user;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      user = { id: userId };
    } else {
      // Fallback to cookie-based auth
      const supabaseClient = await createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = supabaseClient;
      user = authUser;
      userId = authUser.id;
    }

    const eventId = params.id;

    // Check if event exists and user has access
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id, event_manager_id, status')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
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

    // Check permissions - events table uses user_id
    const eventOwnerId =
      existingEvent.user_id || (existingEvent as any).event_manager_id;
    if (eventOwnerId !== user.id) {
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

    // Check if event can be deleted (not in progress or completed)
    if (
      existingEvent.status === 'in_progress' ||
      existingEvent.status === 'completed'
    ) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete event in current status' },
        { status: 400 }
      );
    }

    // Delete event (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
