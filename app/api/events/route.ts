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
  eventType: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid event type' }),
  }),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional().nullable(),
  eventDate: z.string().refine(
    val => {
      if (!val || val.trim() === '') return false;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format - please select a valid date and time' }
  ),
  durationHours: z.number().min(1).max(168).optional().nullable(), // Max 1 week
  attendeeCount: z.number().min(1).max(10000).optional().nullable(),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.object({
      lat: z.number().refine(val => val !== 0, {
        message: 'Please select a valid location',
      }),
      lng: z.number().refine(val => val !== 0, {
        message: 'Please select a valid location',
      }),
    }),
    placeId: z
      .union([z.string(), z.number()])
      .transform(val => String(val))
      .optional()
      .nullable(),
    city: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }),
  specialRequirements: z.string().optional().nullable(),
  serviceRequirements: z
    .array(
      z.object({
        category: z.string(),
        type: z.string(),
        description: z.string().optional().nullable(),
        priority: z.enum(['low', 'medium', 'high']),
        estimatedBudget: z.number().min(0).optional().nullable(),
        isRequired: z.boolean(),
      })
    )
    .optional()
    .default([]),
  budgetPlan: z
    .object({
      totalBudget: z.number().min(0).default(0),
      breakdown: z.record(z.string(), z.any()).optional().default({}),
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
    .optional()
    .default({ totalBudget: 0, breakdown: {}, recommendations: [] }),
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
    console.log('=== POST /api/events START ===');

    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');
    console.log('User ID from header:', userId);

    let supabase;
    let user;
    if (userId) {
      console.log('Using service role client with userId from header');
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('User verification result:', { userData, userError });

      if (userError || !userData) {
        console.error('User verification failed:', userError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: userError?.message,
          },
          { status: 401 }
        );
      }
      user = { id: userId };
    } else {
      console.log('Using middleware client for cookie-based auth');
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user: authUser },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      console.log('Auth result:', { authUser: authUser?.id, authError });

      if (authError || !authUser) {
        console.error('Auth failed:', authError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: authError?.message,
          },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      user = authUser;
      userId = authUser.id;
    }

    console.log('Authentication successful, userId:', userId);

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log(
        'Event creation request body:',
        JSON.stringify(body, null, 2)
      );
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body',
          error: 'Failed to parse JSON',
        },
        { status: 400 }
      );
    }

    let validationResult;
    try {
      validationResult = createEventSchema.safeParse(body);
    } catch (schemaError) {
      console.error('Schema validation error:', schemaError);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation schema error',
          error:
            schemaError instanceof Error
              ? schemaError.message
              : 'Unknown schema error',
        },
        { status: 500 }
      );
    }

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error);
      const errors = validationResult.error?.errors || [];
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: errors.map(err => ({
            field: err.path?.join('.') || 'unknown',
            message: err.message || 'Validation error',
          })),
        },
        { status: 400 }
      );
    }

    let eventData = validationResult.data;

    // Clean breakdown to ensure all values are objects with amount and percentage
    if (eventData.budgetPlan?.breakdown) {
      const cleanedBreakdown: Record<
        string,
        { amount: number; percentage: number }
      > = {};
      Object.entries(eventData.budgetPlan.breakdown).forEach(([key, value]) => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'amount' in value &&
          'percentage' in value
        ) {
          cleanedBreakdown[key] = {
            amount: typeof value.amount === 'number' ? value.amount : 0,
            percentage:
              typeof value.percentage === 'number' ? value.percentage : 0,
          };
        }
        // Skip invalid entries (strings, numbers, etc.)
      });
      eventData = {
        ...eventData,
        budgetPlan: {
          ...eventData.budgetPlan,
          breakdown: cleanedBreakdown,
        },
      };
    }

    // Check if user is an event manager
    console.log('Checking user role for userId:', userId);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    console.log('User role check:', { userData, userError });

    if (userError || !userData || userData.role !== 'event_manager') {
      console.error('User is not an event manager:', {
        role: userData?.role,
        userError,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Only event managers can create events',
          role: userData?.role,
          error: userError?.message,
        },
        { status: 403 }
      );
    }

    // Prepare event insert data - only include columns that exist in the events table
    const eventInsertData: any = {
      user_id: user.id, // Events table uses user_id, not event_manager_id
      title: eventData.title,
      event_date: eventData.eventDate,
      event_type: eventData.eventType,
      location: eventData.location?.address || '',
      attendee_count: eventData.attendeeCount || null,
      duration_hours: eventData.durationHours || null,
      budget: eventData.budgetPlan?.totalBudget ?? 0,
      status: eventData.isDraft ? 'draft' : 'planning',
    };

    // Add optional fields only if they exist in the schema
    if (eventData.description) {
      eventInsertData.description = eventData.description;
    }
    if (eventData.specialRequirements) {
      // Try requirements first (from original schema), then special_requirements
      eventInsertData.requirements = eventData.specialRequirements;
    }

    console.log(
      'Inserting event with data:',
      JSON.stringify(eventInsertData, null, 2)
    );

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventInsertData)
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      console.error('Event error details:', {
        message: eventError.message,
        details: eventError.details,
        hint: eventError.hint,
        code: eventError.code,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create event',
          error: eventError.message,
          details: eventError.details,
          hint: eventError.hint,
          code: eventError.code,
        },
        { status: 500 }
      );
    }

    console.log('Event created successfully:', event?.id);

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
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
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
      try {
        const { createClient } = await import('@/lib/supabase/middleware');
        const { supabase: middlewareSupabase } = createClient(request);
        const {
          data: { user },
          error: authError,
        } = await middlewareSupabase.auth.getUser();

        // Handle refresh token errors gracefully
        if (authError) {
          // Check if it's a refresh token error
          if (
            authError.message?.includes('refresh_token_not_found') ||
            authError.message?.includes('Invalid Refresh Token')
          ) {
            console.warn(
              'Refresh token invalid, user may need to re-authenticate'
            );
            return NextResponse.json(
              {
                success: false,
                message: 'Session expired. Please log in again.',
                code: 'SESSION_EXPIRED',
              },
              { status: 401 }
            );
          }
          return NextResponse.json(
            {
              success: false,
              message: 'Unauthorized',
              error: authError.message,
            },
            { status: 401 }
          );
        }

        if (!user) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          );
        }

        supabase = middlewareSupabase;
        userId = user.id;
      } catch (error: any) {
        // Handle any other auth errors
        console.error('Auth error in GET /api/events:', error);
        return NextResponse.json(
          {
            success: false,
            message: 'Authentication failed. Please log in again.',
            error: error.message,
          },
          { status: 401 }
        );
      }
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
    // Note: events table uses user_id, not event_manager_id
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else {
      // If no filterUserId specified, only show current user's own events
      query = query.eq('user_id', userId);
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
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch events',
          error: eventsError.message,
        },
        { status: 500 }
      );
    }

    const response = {
      success: true,
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
