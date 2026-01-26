import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { SaveEventDraftRequest, EventDraftResponse } from '@/types/events';

// Validation schemas - more flexible for drafts
const saveDraftSchema = z.object({
  eventData: z.object({
    eventType: z.string().optional().nullable(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    eventDate: z.string().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    additionalDates: z
      .array(
        z.object({
          date: z.string(),
          startTime: z.string().optional().nullable(),
          endTime: z.string().optional().nullable(),
        })
      )
      .optional()
      .nullable(),
    durationHours: z.number().optional().nullable(),
    attendeeCount: z.number().optional().nullable(),
    location: z
      .object({
        address: z.string().optional().nullable(),
        coordinates: z
          .object({
            lat: z.number().optional().nullable(),
            lng: z.number().optional().nullable(),
          })
          .optional()
          .nullable(),
        placeId: z
          .union([z.string(), z.number()])
          .transform(val => (val ? String(val) : null))
          .optional()
          .nullable(),
        city: z.string().optional().nullable(),
        region: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        toBeConfirmed: z.boolean().optional().nullable(),
      })
      .optional()
      .nullable(),
    specialRequirements: z.string().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    serviceRequirements: z
      .array(
        z.object({
          id: z.string().optional(),
          category: z.string(),
          type: z.string(),
          description: z.string().optional().nullable(),
          priority: z.enum(['low', 'medium', 'high']),
          estimatedBudget: z.number().min(0).optional().nullable(),
          isRequired: z.boolean(),
        })
      )
      .optional()
      .nullable(),
    budgetPlan: z
      .object({
        totalBudget: z.number().min(0).optional().default(0),
        breakdown: z
          .record(
            z.object({
              amount: z.number().min(0),
              percentage: z.number().min(0).max(100),
            })
          )
          .optional()
          .default({}),
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
      .nullable(),
    isDraft: z.boolean().optional().nullable(),
  }),
  stepNumber: z.number().min(1).max(4),
});

// POST /api/events/drafts - Save event draft
export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/events/drafts START ===');

    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');
    console.log('User ID from header:', userId);

    let supabase;
    if (userId) {
      console.log('Using service role client with userId from header');
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
    } else {
      console.log('Using middleware client for cookie-based auth');
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      console.log('Auth result:', { userId: user?.id, authError });

      if (authError || !user) {
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
      userId = user.id;
    }

    console.log('Authentication successful, userId:', userId);

    // Parse and validate request body
    const body = await request.json();
    console.log('Draft save request body:', JSON.stringify(body, null, 2));

    const validationResult = saveDraftSchema.safeParse(body);

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

    const draftData = validationResult.data;
    const { eventData, stepNumber } = draftData;

    // Map eventData to events table structure
    // Title is required even for drafts
    if (!eventData.title || eventData.title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title is required',
        },
        { status: 400 }
      );
    }

    // Prepare event_date with startTime if provided
    let eventDateValue = eventData.eventDate || null;
    if (eventDateValue && eventData.startTime) {
      // Combine date and startTime into event_date timestamp
      const date = new Date(eventDateValue);
      const startTime = new Date(eventData.startTime);
      date.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        startTime.getSeconds()
      );
      eventDateValue = date.toISOString();
    }

    // Prepare end_date with endTime if provided
    let endDateValue = null;
    if (eventDateValue && eventData.endTime) {
      const date = new Date(eventDateValue);
      const endTime = new Date(eventData.endTime);
      date.setHours(
        endTime.getHours(),
        endTime.getMinutes(),
        endTime.getSeconds()
      );
      endDateValue = date.toISOString();
    }

    // Determine if multi-day event (has additional dates)
    const isMultiDay =
      eventData.additionalDates && eventData.additionalDates.length > 0;

    // Constraint: if is_multi_day is true, end_date must not be null
    // Constraint: end_date must be > event_date (valid_end_date constraint)
    // If we have additional dates but no end_date, set end_date to be later than event_date
    if (isMultiDay && !endDateValue && eventDateValue) {
      // Set end_date to 1 hour after event_date to satisfy valid_end_date constraint
      const endDate = new Date(eventDateValue);
      endDate.setHours(endDate.getHours() + 1);
      endDateValue = endDate.toISOString();
    }

    // Ensure end_date is always greater than event_date (valid_end_date constraint)
    if (
      endDateValue &&
      eventDateValue &&
      new Date(endDateValue) <= new Date(eventDateValue)
    ) {
      // If end_date is not greater than event_date, add 1 hour to end_date
      const endDate = new Date(endDateValue);
      const eventDate = new Date(eventDateValue);
      // If they're equal or end is before start, set end to 1 hour after start
      if (endDate <= eventDate) {
        const adjustedEndDate = new Date(eventDate);
        adjustedEndDate.setHours(adjustedEndDate.getHours() + 1);
        endDateValue = adjustedEndDate.toISOString();
      }
    }

    const eventRecord: any = {
      user_id: userId,
      status: 'draft',
      title: eventData.title.trim(),
      event_type: eventData.eventType || null,
      description: eventData.description || null,
      event_date: eventDateValue,
      end_date: endDateValue,
      is_multi_day: isMultiDay,
      duration_hours: eventData.durationHours || null,
      attendee_count: eventData.attendeeCount || null,
      requirements: eventData.specialRequirements || null,
      budget: eventData.budgetPlan?.totalBudget || null,
      location: eventData.location?.address || null,
      logo_url: eventData.logoUrl || null,
    };

    // Check if user already has a draft event
    console.log('Checking for existing draft for userId:', userId);
    const { data: existingDraft, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .maybeSingle();

    console.log('Draft check result:', { existingDraft, checkError });

    // PGRST116 = no rows returned (expected when no draft exists)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking draft:', checkError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to check for existing draft',
          error: checkError.message,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint,
        },
        { status: 500 }
      );
    }

    let draft;

    if (existingDraft) {
      console.log('Updating existing draft:', existingDraft.id);
      // Update existing draft
      // Try to include draft_step if the column exists
      const updateData: any = {
        ...eventRecord,
        updated_at: new Date().toISOString(),
      };

      // Try to include draft_step (will fail gracefully if column doesn't exist)
      updateData.draft_step = stepNumber;

      const { data: updatedDraft, error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (updateError) {
        // If error is about draft_step column not existing, retry without it
        if (updateError.message?.includes('draft_step')) {
          console.log(
            'draft_step column not found, retrying update without it'
          );
          delete updateData.draft_step;
          const { data: retryDraft, error: retryError } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', existingDraft.id)
            .select()
            .single();

          if (retryError) {
            console.error('Error updating draft (retry):', retryError);
            return NextResponse.json(
              {
                success: false,
                message: 'Failed to update draft',
                error: retryError.message,
                details: retryError.details,
                code: retryError.code,
              },
              { status: 500 }
            );
          }
          draft = retryDraft;
        } else {
          console.error('Error updating draft:', updateError);
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to update draft',
              error: updateError.message,
              details: updateError.details,
              code: updateError.code,
            },
            { status: 500 }
          );
        }
      } else {
        draft = updatedDraft;
      }
      console.log('Draft updated successfully');
    } else {
      console.log('Creating new draft');
      // Create new draft
      // Try to include draft_step if the column exists
      const insertData: any = { ...eventRecord };

      // Only include draft_step if migration has been run
      // We'll try to insert it, and if it fails, we'll retry without it
      try {
        insertData.draft_step = stepNumber;
      } catch (e) {
        // Column doesn't exist, skip it
      }

      const { data: newDraft, error: createError } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        // If error is about draft_step column not existing, retry without it
        if (createError.message?.includes('draft_step')) {
          console.log('draft_step column not found, retrying without it');
          delete insertData.draft_step;
          const { data: retryDraft, error: retryError } = await supabase
            .from('events')
            .insert(insertData)
            .select()
            .single();

          if (retryError) {
            console.error('Error creating draft (retry):', retryError);
            return NextResponse.json(
              {
                success: false,
                message: 'Failed to create draft',
                error: retryError.message,
                details: retryError.details,
                hint: retryError.hint,
                code: retryError.code,
              },
              { status: 500 }
            );
          }
          draft = retryDraft;
        } else {
          console.error('Error creating draft:', createError);
          console.error('Draft error details:', {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
          });
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to create draft',
              error: createError.message,
              details: createError.details,
              hint: createError.hint,
              code: createError.code,
            },
            { status: 500 }
          );
        }
      } else {
        draft = newDraft;
        console.log('Draft created successfully');
      }
    }

    // Save additional dates to event_dates table
    // Always delete existing event_dates first, then insert new ones if provided
    // This handles the case where user removes all additional dates (empty array)
    // Check if additionalDates is explicitly provided (including empty array)
    const hasAdditionalDates =
      eventData.additionalDates !== undefined &&
      eventData.additionalDates !== null;

    if (hasAdditionalDates) {
      console.log('Processing additionalDates for draft:', {
        eventId: draft.id,
        additionalDates: eventData.additionalDates,
        length: eventData.additionalDates?.length || 0,
      });

      // Delete existing event_dates for this draft
      const { error: deleteError } = await supabase
        .from('event_dates')
        .delete()
        .eq('event_id', draft.id);

      if (deleteError) {
        console.error('Error deleting existing event dates:', deleteError);
      } else {
        console.log(
          `Successfully deleted existing event_dates for draft ${draft.id}`
        );
      }

      // Insert new event_dates only if there are any
      if (eventData.additionalDates && eventData.additionalDates.length > 0) {
        const eventDates = eventData.additionalDates
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
              event_id: draft.id,
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
              `Inserted ${eventDates.length} new event_dates for draft ${draft.id}`
            );
          }
        }
      } else {
        // Empty array means user removed all additional dates - deletion already happened above
        console.log(
          'No additional dates to insert (empty array) - all dates deleted'
        );
      }
    } else {
      console.log(
        'additionalDates not provided in eventData, skipping event_dates update'
      );
    }

    // Save service requirements to event_service_requirements table
    if (
      eventData.serviceRequirements &&
      eventData.serviceRequirements.length > 0
    ) {
      // Delete existing service requirements for this draft
      await supabase
        .from('event_service_requirements')
        .delete()
        .eq('event_id', draft.id);

      // Insert new service requirements
      const serviceRequirements = eventData.serviceRequirements.map(req => ({
        event_id: draft.id,
        service_category: req.category,
        service_type: req.type,
        description: req.description || null,
        priority: req.priority,
        estimated_budget: req.estimatedBudget || null,
        is_required: req.isRequired,
      }));

      const { error: serviceError } = await supabase
        .from('event_service_requirements')
        .insert(serviceRequirements);

      if (serviceError) {
        // Don't fail the entire request, just log the error
        console.error('Error saving service requirements:', serviceError);
      }
    } else {
      // If no service requirements provided, delete any existing ones
      await supabase
        .from('event_service_requirements')
        .delete()
        .eq('event_id', draft.id);
    }

    // Fetch service requirements for the response
    const { data: serviceRequirements } = await supabase
      .from('event_service_requirements')
      .select('*')
      .eq('event_id', draft.id);

    // Transform service requirements back to the expected format
    const transformedServiceRequirements =
      serviceRequirements?.map(req => ({
        id: req.id,
        category: req.service_category,
        type: req.service_type,
        description: req.description,
        priority: req.priority as 'low' | 'medium' | 'high',
        estimatedBudget: req.estimated_budget,
        isRequired: req.is_required,
      })) || null;

    // Transform the event record back to the expected draft format for the response
    const draftResponse = {
      id: draft.id,
      user_id: draft.user_id,
      event_data: {
        eventType: draft.event_type,
        title: draft.title,
        description: draft.description,
        eventDate: draft.event_date,
        durationHours: draft.duration_hours,
        attendeeCount: draft.attendee_count,
        location: draft.location
          ? {
              address: draft.location,
              coordinates: { lat: 0, lng: 0 }, // We don't have coordinates stored separately
            }
          : null,
        specialRequirements: draft.requirements,
        serviceRequirements: transformedServiceRequirements,
        budgetPlan: eventData.budgetPlan || null,
        isDraft: true,
      },
      step_number: draft.draft_step || 1,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
    };

    const response: EventDraftResponse = {
      draft: draftResponse,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events/drafts:', error);
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

// GET /api/events/drafts - Get user's event drafts
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

    // Get user's draft events
    const { data: drafts, error: draftsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (draftsError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch drafts' },
        { status: 500 }
      );
    }

    // Transform the event record to the expected draft format
    const draft = drafts?.[0];

    let transformedServiceRequirements = null;
    let startTime: string | undefined = undefined;
    let endTime: string | undefined = undefined;
    let additionalDates: Array<{
      date: string;
      startTime?: string;
      endTime?: string;
    }> = [];

    if (draft) {
      // Fetch service requirements for the draft
      const { data: serviceRequirements } = await supabase
        .from('event_service_requirements')
        .select('*')
        .eq('event_id', draft.id);

      // Transform service requirements back to the expected format
      transformedServiceRequirements =
        serviceRequirements?.map(req => ({
          id: req.id,
          category: req.service_category,
          type: req.service_type,
          description: req.description,
          priority: req.priority as 'low' | 'medium' | 'high',
          estimatedBudget: req.estimated_budget,
          isRequired: req.is_required,
        })) || null;

      // Extract startTime and endTime from event_date and end_date
      if (draft.event_date) {
        startTime = new Date(draft.event_date).toISOString();
      }
      if (draft.end_date) {
        endTime = new Date(draft.end_date).toISOString();
      }

      // Fetch additional dates from event_dates table
      // Use supabaseAdmin to bypass RLS in case event_dates table has RLS enabled
      const { data: eventDates, error: eventDatesError } = await supabaseAdmin
        .from('event_dates')
        .select('*')
        .eq('event_id', draft.id)
        .order('display_order', { ascending: true });

      if (eventDatesError) {
        console.error(
          'Error fetching event_dates in drafts GET:',
          eventDatesError
        );
      }

      if (eventDates && eventDates.length > 0) {
        additionalDates = eventDates.map((ed: any) => {
          const dateStr = ed.date; // YYYY-MM-DD
          const startTimeStr = ed.start_time; // HH:MM:SS
          const endTimeStr = ed.end_time; // HH:MM:SS

          // Create ISO strings for the date with times
          const dateWithStartTime = startTimeStr
            ? new Date(`${dateStr}T${startTimeStr}`).toISOString()
            : new Date(`${dateStr}T00:00:00`).toISOString();
          const dateWithEndTime = endTimeStr
            ? new Date(`${dateStr}T${endTimeStr}`).toISOString()
            : new Date(`${dateStr}T23:59:59`).toISOString();

          // Extract date portion for the date field
          const dateOnly = new Date(dateStr);
          const dateOnlyISO = new Date(
            dateOnly.getFullYear(),
            dateOnly.getMonth(),
            dateOnly.getDate()
          ).toISOString();

          return {
            date: dateOnlyISO,
            startTime: dateWithStartTime,
            endTime: dateWithEndTime,
          };
        });
      }
    }

    const draftResponse = draft
      ? {
          id: draft.id,
          user_id: draft.user_id,
          event_data: {
            eventType: draft.event_type,
            title: draft.title,
            description: draft.description,
            eventDate: draft.event_date,
            startTime: startTime,
            endTime: endTime,
            additionalDates: additionalDates,
            durationHours: draft.duration_hours,
            attendeeCount: draft.attendee_count,
            location: draft.location
              ? {
                  address: draft.location,
                  coordinates: { lat: 0, lng: 0 }, // We don't have coordinates stored separately
                }
              : null,
            specialRequirements: draft.requirements,
            serviceRequirements: transformedServiceRequirements,
            budgetPlan: draft.budget
              ? {
                  totalBudget: draft.budget,
                  breakdown: {},
                  recommendations: [],
                }
              : null,
            isDraft: true,
          },
          step_number: draft.draft_step || 1,
          created_at: draft.created_at,
          updated_at: draft.updated_at,
        }
      : null;

    const response: EventDraftResponse = {
      draft: draftResponse,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/drafts - Delete user's event draft
export async function DELETE(request: NextRequest) {
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

    // Delete user's draft event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'draft');

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
