import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  CreateEventRequest,
  GetEventsRequest,
  EventCreationResponse,
  EventListResponse,
  EVENT_TYPES,
  EVENT_STATUS,
} from '@/types/events';

// Validation schemas
const createEventSchema = z.object({
  eventType: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]]),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  eventDate: z.string().datetime('Invalid date format'),
  durationHours: z.number().min(1).max(168).optional(), // Max 1 week
  attendeeCount: z.number().min(1).max(10000).optional(),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    placeId: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
  }),
  specialRequirements: z.string().optional(),
  serviceRequirements: z
    .array(
      z.object({
        category: z.string(),
        type: z.string(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']),
        estimatedBudget: z.number().min(0).optional(),
        isRequired: z.boolean(),
      })
    )
    .optional()
    .default([]),
  budgetPlan: z.object({
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
  }),
  isDraft: z.boolean().optional().default(false),
});

const getEventsSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z
    .enum(Object.values(EVENT_STATUS) as [string, ...string[]])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  eventType: z.string().optional(),
});

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    let user;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (userError || !userData) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      user = { id: userId };
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user: authUser },
        error: authError,
      } = await middlewareSupabase.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      user = authUser;
      userId = authUser.id;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createEventSchema.safeParse(body);

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

    const eventData = validationResult.data;

    // Check if user is an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !userProfile || userProfile.role !== 'event_manager') {
      return NextResponse.json(
        { success: false, message: 'Only event managers can create events' },
        { status: 403 }
      );
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        event_manager_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.eventDate,
        event_type: eventData.eventType,
        duration_hours: eventData.durationHours,
        attendee_count: eventData.attendeeCount,
        location: eventData.location?.address || '',
        location_data: eventData.location || null,
        special_requirements: eventData.specialRequirements || null,
        budget_total: eventData.budgetPlan?.totalBudget || 0,
        budget_min: eventData.budgetPlan?.totalBudget
          ? eventData.budgetPlan.totalBudget * 0.8
          : 0, // 20% buffer
        budget_max: eventData.budgetPlan?.totalBudget
          ? eventData.budgetPlan.totalBudget * 1.2
          : 0, // 20% buffer
        status: eventData.isDraft ? 'draft' : 'planning',
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create event',
          error: eventError.message,
        },
        { status: 500 }
      );
    }

    // Create service requirements if provided
    if (
      eventData.serviceRequirements &&
      eventData.serviceRequirements.length > 0
    ) {
      const serviceRequirements = eventData.serviceRequirements.map(req => ({
        event_id: event.id,
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
        // Don't fail the entire request, just log the error
        console.error('Error creating service requirements:', serviceError);
      }
    }

    // Create initial version record
    const { error: versionError } = await supabase
      .from('event_versions')
      .insert({
        event_id: event.id,
        version_number: 1,
        changes: {
          action: 'created',
          data: eventData,
        },
        created_by: user.id,
      });

    if (versionError) {
      // Don't fail the entire request
      console.error('Error creating event version:', versionError);
    }

    const response: EventCreationResponse = {
      event,
      success: true,
      message: eventData.isDraft
        ? 'Event draft saved successfully'
        : 'Event created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/events - Get events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      userId = user.id;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getEventsSchema.safeParse(queryParams);

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

    const {
      userId: filterUserId,
      status,
      page,
      limit,
      eventType,
    } = validationResult.data;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('events')
      .select(
        `
        *,
        profiles!events_event_manager_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (filterUserId) {
      query = query.eq('event_manager_id', filterUserId);
    } else {
      // If no filterUserId specified, only show current user's own events
      query = query.eq('event_manager_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    const response: EventListResponse = {
      events: events || [],
      total: count || 0,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
