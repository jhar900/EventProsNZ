import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { EventStatusUpdateSchema } from '@/lib/validation/eventValidation';
import {
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/errorHandler';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { EventAuthService } from '@/lib/middleware/eventAuth';
import { EVENT_STATUS } from '@/types/events';

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum(Object.values(EVENT_STATUS) as [string, ...string[]]),
  reason: z.string().optional(),
});

const getStatusOverviewSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z
    .enum(Object.values(EVENT_STATUS) as [string, ...string[]])
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// PUT /api/events/[id]/status - Update event status
async function updateStatusHandler(
  request: NextRequest,
  { params }: { params: { id: string } },
  authContext?: any
) {
  const eventId = params.id;

  // Try to get user ID from header first (sent by client)
  const userId = request.headers.get('x-user-id');
  let user;
  let supabase;

  if (userId) {
    // Use admin client if we have user ID from header
    supabase = supabaseAdmin;
    // Verify user exists
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (!userData) {
      return createErrorResponse('Unauthorized', 401);
    }
    user = {
      id: userData.id,
      email: userData.email || '',
      role: userData.role,
    } as any;
  } else {
    // Fallback to cookie-based auth using middleware client
    try {
      const { createClient: createMiddlewareClient } = await import(
        '@/lib/supabase/middleware'
      );
      const { supabase: middlewareSupabase } = createMiddlewareClient(request);
      const {
        data: { user: authUser },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      if (authError || !authUser) {
        return createErrorResponse('Unauthorized', 401);
      }
      user = authUser;
      supabase = middlewareSupabase;
    } catch (error) {
      console.error('Error in cookie-based auth:', error);
      return createErrorResponse('Unauthorized', 401);
    }
  }

  if (!user) {
    return createErrorResponse('Unauthorized', 401);
  }

  // Parse and validate request body
  const body = await request.json();
  const validationResult = EventStatusUpdateSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    );
  }

  const { status: newStatus, reason } = validationResult.data;

  // Get current event status for validation and check ownership
  // Use admin client to bypass RLS if needed
  const querySupabase = userId ? supabaseAdmin : supabase;
  const { data: existingEvent, error: fetchError } = await querySupabase
    .from('events')
    .select('status, user_id')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching event:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return createErrorResponse('Event not found', 404);
    }
    return createErrorResponse(
      `Failed to fetch event: ${fetchError.message}`,
      500
    );
  }

  if (!existingEvent) {
    return createErrorResponse('Event not found', 404);
  }

  // Check ownership - events table uses user_id
  const eventOwnerId = existingEvent.user_id;
  const isAdmin = (user as any).role === 'admin';

  if (eventOwnerId !== user.id && !isAdmin) {
    return createErrorResponse('Access denied - ownership required', 403);
  }

  // Owners and admins can transition to any status - no validation needed

  // Update event status - use admin client if we have userId from header
  const { data: updatedEvent, error: updateError } = await querySupabase
    .from('events')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse('Failed to update event status', 500);
  }

  // Create status history record - use admin client if we have userId from header
  const { error: historyError } = await querySupabase
    .from('event_status_history')
    .insert({
      event_id: eventId,
      previous_status: existingEvent.status,
      new_status: newStatus,
      changed_by: user.id,
      reason: reason,
      created_at: new Date().toISOString(),
    });

  if (historyError) {
    // Don't fail the request, just log the error
    console.error('Error creating status history:', historyError);
  }

  // Create notification for contractors if status changed to confirmed or in_progress
  if (newStatus === 'confirmed' || newStatus === 'in_progress') {
    // Get contractors associated with this event - use admin client if we have userId from header
    const { data: contractors } = await querySupabase
      .from('event_contractor_matches')
      .select('contractor_id')
      .eq('event_id', eventId)
      .eq('status', 'accepted');

    if (contractors && contractors.length > 0) {
      const notifications = contractors.map(contractor => ({
        event_id: eventId,
        contractor_id: contractor.contractor_id,
        notification_type:
          newStatus === 'confirmed' ? 'event_confirmed' : 'event_in_progress',
        message: `Event status updated to ${newStatus}`,
        created_at: new Date().toISOString(),
      }));

      const { error: notificationError } = await querySupabase
        .from('event_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
    }
  }

  return createSuccessResponse({
    event: updatedEvent,
    message: 'Event status updated successfully',
  });
}

// GET /api/events/[id]/status - Get event status and history
async function getStatusHandler(
  request: NextRequest,
  { params }: { params: { id: string } },
  authContext: any
) {
  const supabase = await createClient();
  const eventId = params.id;

  // Validate event access using centralized authorization
  const accessResult = await EventAuthService.validateEventAccess(
    eventId,
    authContext.user.id
  );

  if (!accessResult.hasAccess) {
    return createErrorResponse('Access denied', 403);
  }

  // Get event with status history
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      `
      *,
      event_status_history (
        id,
        previous_status,
        new_status,
        changed_by,
        reason,
        created_at,
        profiles!event_status_history_changed_by_fkey (
          first_name,
          last_name
        )
      )
    `
    )
    .eq('id', eventId)
    .single();

  if (eventError) {
    if (eventError.code === 'PGRST116') {
      return createErrorResponse('Event not found', 404);
    }
    return createErrorResponse('Failed to fetch event', 500);
  }

  return createSuccessResponse({ event });
}

// Export the secure endpoints with rate limiting and error handling
// Note: We handle auth manually in the handler to support x-user-id header
export const PUT = withRateLimit(
  'events',
  withErrorHandling(
    async (
      request: NextRequest,
      context: { params: Promise<{ id: string }> | { id: string } }
    ) => {
      const params = await Promise.resolve(context.params);
      return await updateStatusHandler(request, { params });
    }
  )
);

export const GET = withRateLimit(
  'events',
  withErrorHandling(EventAuthService.withEventAuth(getStatusHandler))
);
