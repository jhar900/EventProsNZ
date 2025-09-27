import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
  authContext: any
) {
  const supabase = await createClient();
  const eventId = params.id;

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

  // Validate event access using centralized authorization
  const accessResult = await EventAuthService.validateEventAccess(
    eventId,
    authContext.user.id
  );

  if (!accessResult.hasAccess) {
    return createErrorResponse('Access denied', 403);
  }

  // Get current event status for validation
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return createErrorResponse('Event not found', 404);
    }
    console.error('Error fetching event:', fetchError);
    return createErrorResponse('Failed to fetch event', 500);
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    draft: ['planning', 'cancelled'],
    planning: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // No transitions from completed
    cancelled: [], // No transitions from cancelled
  };

  const allowedTransitions = validTransitions[existingEvent.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return createErrorResponse(
      `Cannot transition from ${existingEvent.status} to ${newStatus}`,
      400
    );
  }

  // Update event status
  const { data: updatedEvent, error: updateError } = await supabase
    .from('events')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating event status:', updateError);
    return createErrorResponse('Failed to update event status', 500);
  }

  // Create status history record
  const { error: historyError } = await supabase
    .from('event_status_history')
    .insert({
      event_id: eventId,
      previous_status: existingEvent.status,
      new_status: newStatus,
      changed_by: authContext.user.id,
      reason: reason,
      created_at: new Date().toISOString(),
    });

  if (historyError) {
    console.error('Error creating status history:', historyError);
    // Don't fail the request, just log the error
  }

  // Create notification for contractors if status changed to confirmed or in_progress
  if (newStatus === 'confirmed' || newStatus === 'in_progress') {
    // Get contractors associated with this event
    const { data: contractors } = await supabase
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

      const { error: notificationError } = await supabase
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
    console.error('Error fetching event:', eventError);
    return createErrorResponse('Failed to fetch event', 500);
  }

  return createSuccessResponse({ event });
}

// Export the secure endpoints with rate limiting and error handling
export const PUT = withRateLimit(
  'events',
  withErrorHandling(
    EventAuthService.withEventAuth(updateStatusHandler, {
      requireOwnership: true,
    })
  )
);

export const GET = withRateLimit(
  'events',
  withErrorHandling(EventAuthService.withEventAuth(getStatusHandler))
);
