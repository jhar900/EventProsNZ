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
  startTime: z.string().datetime('Invalid date format').optional(),
  endTime: z.string().datetime('Invalid date format').optional(),
  additionalDates: z
    .array(
      z.object({
        date: z.string(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
      })
    )
    .optional(),
  durationHours: z.number().min(1).max(168).optional(), // Max 1 week
  attendeeCount: z.number().min(1).max(10000).optional(),
  location: z
    .object({
      address: z.string().optional().nullable(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      placeId: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      toBeConfirmed: z.boolean().optional().nullable(),
      isVirtual: z.boolean().optional().nullable(),
    })
    .refine(
      data => {
        // If isVirtual is true, location validation is skipped
        if (data.isVirtual) {
          return true;
        }
        // If toBeConfirmed is true, address and coordinates can be empty
        if (data.toBeConfirmed) {
          return true;
        }
        // Otherwise, address is required and coordinates must be valid
        return (
          data.address &&
          data.address.trim() !== '' &&
          data.coordinates.lat !== 0 &&
          data.coordinates.lng !== 0
        );
      },
      {
        message:
          'Please provide a valid location or mark it as "To Be Confirmed"',
      }
    )
    .optional(),
  specialRequirements: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
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
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const eventId = resolvedParams.id;

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

    // Get additional dates from event_dates table
    // Use supabaseAdmin to bypass RLS in case event_dates table has RLS enabled
    const { data: eventDates, error: datesError } = await supabaseAdmin
      .from('event_dates')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (datesError) {
      console.error('Error fetching event dates:', datesError);
      console.error('Event dates error details:', {
        message: datesError.message,
        code: datesError.code,
        details: datesError.details,
        hint: datesError.hint,
      });
      // Don't fail if event dates can't be fetched, just log it
    } else {
      console.log('Successfully fetched event_dates:', {
        eventId,
        count: eventDates?.length || 0,
        eventDates: eventDates,
      });
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

    // Combine event with service requirements and event dates
    const eventWithRelations = {
      ...event,
      event_service_requirements: serviceRequirements || [],
      event_dates: eventDates || [],
    };

    // Check if user has access to this event
    // Events table uses user_id
    const eventOwnerId = eventWithRelations.user_id;

    if (eventOwnerId !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role === 'admin') {
        // Admins have access to all events
      } else {
        // Check if user is a team member of this event
        // First, find team_members records where user is a team member
        const { data: teamMemberRecords } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_member_id', user.id)
          .in('status', ['invited', 'active', 'onboarding']);

        const teamMemberIds = teamMemberRecords?.map(tm => tm.id) || [];

        if (teamMemberIds.length > 0) {
          // Check if any of these team members are assigned to this event
          const { data: eventTeamMemberRecords } = await supabaseAdmin
            .from('event_team_members')
            .select('id')
            .eq('event_id', eventId)
            .in('team_member_id', teamMemberIds)
            .limit(1);

          if (!eventTeamMemberRecords || eventTeamMemberRecords.length === 0) {
            return NextResponse.json(
              { success: false, message: 'Access denied' },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, message: 'Access denied' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({
      event: eventWithRelations,
      success: true,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
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

// PUT /api/events/[id] - Update a specific event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const eventId = resolvedParams.id;

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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body',
          error:
            parseError instanceof Error ? parseError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    console.log('PUT /api/events/[id] - Request body received:', {
      eventId,
      bodyKeys: Object.keys(body),
      hasAdditionalDates: body.additionalDates !== undefined,
      additionalDates: body.additionalDates,
      additionalDatesLength: Array.isArray(body.additionalDates)
        ? body.additionalDates.length
        : 'not an array',
      hasServiceRequirements: body.serviceRequirements !== undefined,
      serviceRequirementsType: typeof body.serviceRequirements,
      serviceRequirementsIsArray: Array.isArray(body.serviceRequirements),
      hasLocation: body.location !== undefined,
      location: body.location,
    });

    const validationResult = updateEventSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error?.errors || [];
      console.error('Validation failed:', {
        errors: validationErrors,
        errorCount: validationErrors.length,
        body: body,
        errorDetails: validationErrors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            validationErrors.length > 0
              ? validationErrors.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                }))
              : [{ field: 'general', message: 'Validation failed' }],
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Debug: Log the received update data
    console.log('PUT /api/events/[id] - Received update data:', {
      eventId,
      hasAdditionalDates: updateData.additionalDates !== undefined,
      additionalDates: updateData.additionalDates,
      additionalDatesLength: Array.isArray(updateData.additionalDates)
        ? updateData.additionalDates.length
        : 'not an array',
      updateDataKeys: Object.keys(updateData),
      hasLocation: updateData.location !== undefined,
      location: updateData.location,
      hasEventDate: updateData.eventDate !== undefined,
      eventDate: updateData.eventDate,
      hasStartTime: updateData.startTime !== undefined,
      startTime: updateData.startTime,
      hasEndTime: updateData.endTime !== undefined,
      endTime: updateData.endTime,
    });

    // Check if event exists and user has access
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id, status')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      console.error('Error fetching event for update:', {
        eventId,
        error: fetchError,
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch event',
          error: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 }
      );
    }

    // Check permissions - events table uses user_id
    const eventOwnerId = existingEvent.user_id;
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

    // Get existing event data once to avoid multiple queries
    let existingEventData: {
      event_date?: string;
      end_date?: string;
      status?: string;
      attendee_count?: number;
      duration_hours?: number;
      location?: string;
    } | null = null;
    if (
      updateData.eventDate ||
      updateData.startTime ||
      updateData.endTime ||
      updateData.status
    ) {
      const { data: existing } = await supabase
        .from('events')
        .select(
          'event_date, end_date, status, attendee_count, duration_hours, location'
        )
        .eq('id', eventId)
        .single();
      existingEventData = existing || null;
    }

    // Handle event_date with startTime if provided
    if (updateData.eventDate) {
      let eventDateValue = updateData.eventDate;
      if (updateData.startTime) {
        // Combine date and startTime into event_date timestamp
        const date = new Date(updateData.eventDate);
        const startTime = new Date(updateData.startTime);
        date.setHours(
          startTime.getHours(),
          startTime.getMinutes(),
          startTime.getSeconds()
        );
        eventDateValue = date.toISOString();
      } else if (existingEventData?.event_date) {
        // If eventDate is updated but startTime is not, preserve the existing time
        const existingDate = new Date(existingEventData.event_date);
        const newDate = new Date(updateData.eventDate);
        newDate.setHours(
          existingDate.getHours(),
          existingDate.getMinutes(),
          existingDate.getSeconds(),
          existingDate.getMilliseconds()
        );
        eventDateValue = newDate.toISOString();
      }
      eventUpdateData.event_date = eventDateValue;
    } else if (updateData.startTime) {
      // If only startTime is updated, get existing event_date and update it
      if (existingEventData?.event_date) {
        const date = new Date(existingEventData.event_date);
        const startTime = new Date(updateData.startTime);
        date.setHours(
          startTime.getHours(),
          startTime.getMinutes(),
          startTime.getSeconds()
        );
        eventUpdateData.event_date = date.toISOString();
      }
    }

    // Handle end_date with endTime if provided
    if (updateData.endTime) {
      console.log('Processing endTime update:', {
        endTime: updateData.endTime,
        hasEventDate: !!eventUpdateData.event_date,
        eventDate: eventUpdateData.event_date,
        hasExistingEventDate: !!existingEventData?.event_date,
        existingEventDate: existingEventData?.event_date,
        hasEventDateInPayload: !!updateData.eventDate,
      });

      // Get the event date to use as base for end_date
      // Use the updated event_date if available, otherwise use existing event_date
      let baseDate: Date | null = null;
      if (eventUpdateData.event_date) {
        // Use the updated event_date (which includes the date and potentially updated start time)
        baseDate = new Date(eventUpdateData.event_date);
      } else if (existingEventData?.event_date) {
        // Use existing event_date as base
        baseDate = new Date(existingEventData.event_date);
      } else if (updateData.eventDate) {
        // Fallback to the eventDate if provided
        baseDate = new Date(updateData.eventDate);
      }

      if (baseDate) {
        const endTime = new Date(updateData.endTime);
        // Extract just the date portion from baseDate, then set the end time
        const endDate = new Date(baseDate);
        endDate.setHours(
          endTime.getHours(),
          endTime.getMinutes(),
          endTime.getSeconds(),
          0
        );

        // Ensure end_date is greater than event_date (valid_end_date constraint)
        // If endTime results in end_date being equal to or before event_date, adjust it
        const eventDateForComparison = eventUpdateData.event_date
          ? new Date(eventUpdateData.event_date)
          : baseDate;

        if (endDate <= eventDateForComparison) {
          // If end_date would be equal to or before event_date, set it to 1 hour after event_date
          const adjustedEndDate = new Date(eventDateForComparison);
          adjustedEndDate.setHours(adjustedEndDate.getHours() + 1);
          eventUpdateData.end_date = adjustedEndDate.toISOString();
          console.log('Adjusted end_date because it was <= event_date:', {
            originalEndDate: endDate.toISOString(),
            adjustedEndDate: adjustedEndDate.toISOString(),
            eventDate: eventDateForComparison.toISOString(),
          });
        } else {
          eventUpdateData.end_date = endDate.toISOString();
        }

        console.log('Set end_date:', {
          baseDate: baseDate.toISOString(),
          endTime: endTime.toISOString(),
          endDate: eventUpdateData.end_date,
          eventDate: eventDateForComparison.toISOString(),
        });
      } else {
        console.warn('Cannot set end_date: no base date available', {
          hasEventDate: !!eventUpdateData.event_date,
          hasExistingEventDate: !!existingEventData?.event_date,
          hasEventDateInPayload: !!updateData.eventDate,
        });
      }
    } else {
      console.log('No endTime in updateData');
    }

    // Handle is_multi_day
    // Constraint: valid_multi_day CHECK (is_multi_day = (end_date IS NOT NULL))
    // This constraint enforces: is_multi_day = TRUE ↔ end_date IS NOT NULL
    // So if end_date exists, is_multi_day MUST be true (even for single-day events with end time)
    if (updateData.additionalDates !== undefined) {
      const hasAdditionalDates =
        updateData.additionalDates && updateData.additionalDates.length > 0;

      // Determine if end_date will exist after this update
      // Check if end_date was set from endTime above, or if it exists in existing data and won't be cleared
      const willHaveEndDate =
        !!eventUpdateData.end_date ||
        (existingEventData?.end_date && !updateData.endTime);

      // is_multi_day must be true if: there are additional dates OR end_date exists (due to constraint)
      // The constraint requires: if end_date exists, is_multi_day MUST be true
      const isMultiDay = hasAdditionalDates || willHaveEndDate;
      eventUpdateData.is_multi_day = isMultiDay;

      if (!hasAdditionalDates && !willHaveEndDate) {
        // No additional dates and no end_date - single-day event without end time
        // Set end_date to NULL to satisfy constraint (is_multi_day will be false)
        eventUpdateData.end_date = null;
      } else if (hasAdditionalDates) {
        // Has additional dates - ensure end_date is set
        // Constraint: if is_multi_day is true, end_date must not be null
        // Constraint: end_date must be > event_date (valid_end_date constraint)
        // If we have additional dates but no end_date, set end_date to be later than event_date
        if (!eventUpdateData.end_date) {
          const baseDate = eventUpdateData.event_date
            ? new Date(eventUpdateData.event_date)
            : (
                  await supabase
                    .from('events')
                    .select('event_date')
                    .eq('id', eventId)
                    .single()
                ).data?.event_date
              ? new Date(
                  (
                    await supabase
                      .from('events')
                      .select('event_date')
                      .eq('id', eventId)
                      .single()
                  ).data.event_date
                )
              : null;

          if (baseDate) {
            // Set end_date to 1 hour after event_date to satisfy valid_end_date constraint
            const endDate = new Date(baseDate);
            endDate.setHours(endDate.getHours() + 1);
            eventUpdateData.end_date = endDate.toISOString();
          }
        }

        // Ensure end_date is always greater than event_date (valid_end_date constraint)
        if (eventUpdateData.end_date && eventUpdateData.event_date) {
          const endDate = new Date(eventUpdateData.end_date);
          const eventDate = new Date(eventUpdateData.event_date);
          // If they're equal or end is before start, set end to 1 hour after start
          if (endDate <= eventDate) {
            const adjustedEndDate = new Date(eventDate);
            adjustedEndDate.setHours(adjustedEndDate.getHours() + 1);
            eventUpdateData.end_date = adjustedEndDate.toISOString();
            console.log('Adjusted end_date to be after event_date:', {
              originalEndDate: eventUpdateData.end_date,
              adjustedEndDate: adjustedEndDate.toISOString(),
              eventDate: eventUpdateData.event_date,
            });
          }
        }
      }
    }

    // Final check: Ensure end_date is always greater than event_date (valid_end_date constraint)
    // This applies to all cases, not just when additionalDates are provided
    if (eventUpdateData.end_date && eventUpdateData.event_date) {
      const endDate = new Date(eventUpdateData.end_date);
      const eventDate = new Date(eventUpdateData.event_date);
      // If they're equal or end is before start, set end to 1 hour after start
      if (endDate <= eventDate) {
        const adjustedEndDate = new Date(eventDate);
        adjustedEndDate.setHours(adjustedEndDate.getHours() + 1);
        eventUpdateData.end_date = adjustedEndDate.toISOString();
        console.log('Final adjustment: end_date must be > event_date:', {
          originalEndDate: endDate.toISOString(),
          adjustedEndDate: adjustedEndDate.toISOString(),
          eventDate: eventDate.toISOString(),
        });
      }
    }

    if (updateData.durationHours)
      eventUpdateData.duration_hours = updateData.durationHours;
    if (updateData.attendeeCount)
      eventUpdateData.attendee_count = updateData.attendeeCount;
    if (updateData.location) {
      eventUpdateData.location = updateData.location.isVirtual
        ? 'Virtual Event'
        : updateData.location.address;
      eventUpdateData.location_data = updateData.location;
    }
    if (updateData.specialRequirements !== undefined)
      eventUpdateData.requirements = updateData.specialRequirements;
    if (updateData.logoUrl !== undefined)
      eventUpdateData.logo_url = updateData.logoUrl;
    // Only update budget if budgetPlan is provided and we're not on step 1 (event basics)
    // Budget should only be saved from step 3 (Budget Planning)
    if (updateData.budgetPlan && updateData.budgetPlan.totalBudget > 0) {
      eventUpdateData.budget = updateData.budgetPlan.totalBudget;
    }
    if (updateData.status) eventUpdateData.status = updateData.status;

    // When transitioning from draft to another status, ensure required fields have valid values
    // to satisfy database constraints
    if (
      existingEventData?.status === 'draft' &&
      updateData.status &&
      updateData.status !== 'draft'
    ) {
      // attendee_count constraint: must be > 0 when status is not 'draft'
      if (
        !eventUpdateData.attendee_count &&
        (!existingEventData.attendee_count ||
          existingEventData.attendee_count <= 0)
      ) {
        eventUpdateData.attendee_count = 50; // Default to 50 attendees
        console.log(
          'Setting default attendee_count=50 when transitioning from draft to',
          updateData.status
        );
      }

      // location constraint: must be non-empty when status is not 'draft'
      // If location is not being updated and existing location is empty/null, set to "To Be Confirmed"
      if (
        !eventUpdateData.location &&
        (!existingEventData.location ||
          existingEventData.location.trim().length === 0)
      ) {
        eventUpdateData.location = 'To Be Confirmed';
        console.log(
          'Setting default location="To Be Confirmed" when transitioning from draft to',
          updateData.status
        );
      }
    }

    // Update event
    console.log('Updating event with data:', {
      eventId,
      eventUpdateDataKeys: Object.keys(eventUpdateData),
      eventUpdateData: eventUpdateData,
    });

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(eventUpdateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', {
        eventId,
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        eventUpdateData: eventUpdateData,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update event',
          error: updateError.message,
          code: updateError.code,
        },
        { status: 500 }
      );
    }

    // Update additional dates in event_dates table if provided
    // Always delete existing event_dates first, then insert new ones if provided
    // This handles the case where user removes all additional dates (empty array)
    if (updateData.additionalDates !== undefined) {
      console.log('Processing additionalDates for event update:', {
        eventId,
        additionalDates: updateData.additionalDates,
        length: updateData.additionalDates?.length || 0,
        isArray: Array.isArray(updateData.additionalDates),
      });

      // Delete existing event_dates for this event
      const { error: deleteError } = await supabase
        .from('event_dates')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
        console.error('Error deleting existing event dates:', deleteError);
      } else {
        console.log(
          `Successfully deleted existing event_dates for event ${eventId}`
        );
      }

      // Insert new event_dates if any (empty array means no additional dates)
      if (updateData.additionalDates && updateData.additionalDates.length > 0) {
        const eventDates = updateData.additionalDates
          .filter(ad => ad.date && ad.date.trim())
          .map((ad, index) => {
            const dateObj = new Date(ad.date);
            const startTimeObj = ad.startTime ? new Date(ad.startTime) : null;
            const endTimeObj = ad.endTime ? new Date(ad.endTime) : null;

            // Extract date part (YYYY-MM-DD)
            const dateStr = dateObj.toISOString().split('T')[0];

            // Extract time parts (HH:MM:SS)
            const startTimeStr = startTimeObj
              ? `${startTimeObj.getHours().toString().padStart(2, '0')}:${startTimeObj.getMinutes().toString().padStart(2, '0')}:00`
              : '00:00:00';
            const endTimeStr = endTimeObj
              ? `${endTimeObj.getHours().toString().padStart(2, '0')}:${endTimeObj.getMinutes().toString().padStart(2, '0')}:00`
              : '23:59:59';

            return {
              event_id: eventId,
              date: dateStr,
              start_time: startTimeStr,
              end_time: endTimeStr,
              display_order: index + 1,
              timezone:
                Intl.DateTimeFormat().resolvedOptions().timeZone || null,
              description: null,
            };
          });

        if (eventDates.length > 0) {
          const { error: datesError } = await supabase
            .from('event_dates')
            .insert(eventDates);

          if (datesError) {
            console.error('Error saving event dates:', datesError);
          } else {
            console.log(
              `Inserted ${eventDates.length} new event_dates for event ${eventId}`
            );
          }
        } else {
          // Filtered array is empty (all dates had empty date strings) - no dates to insert
          console.log(
            `No valid dates to insert after filtering - all dates deleted for event ${eventId}`
          );
        }
      } else {
        // Empty array means user removed all additional dates - deletion already happened above
        // This is the expected case when user deletes all additional dates from UI
        console.log(
          `No additional dates to insert (empty array) - all dates deleted for event ${eventId}`
        );
      }
    } else {
      console.log(
        `additionalDates not provided in updateData, skipping event_dates update for event ${eventId}`
      );
    }

    // Update service requirements if provided
    if (
      updateData.serviceRequirements &&
      Array.isArray(updateData.serviceRequirements)
    ) {
      // Delete existing service requirements
      const { error: deleteError } = await supabase
        .from('event_service_requirements')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
        console.error(
          'Error deleting existing service requirements:',
          deleteError
        );
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
    console.error('Error in PUT /api/events/[id]:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
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

// DELETE /api/events/[id] - Delete a specific event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const eventId = resolvedParams.id;

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

    // Check if event exists and user has access
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id, status')
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
    const eventOwnerId = existingEvent.user_id;
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
