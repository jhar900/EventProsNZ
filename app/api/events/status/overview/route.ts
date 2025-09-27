import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { EVENT_STATUS } from '@/types/events';

// Validation schema
const getStatusOverviewSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z
    .enum(Object.values(EVENT_STATUS) as [string, ...string[]])
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// GET /api/events/status/overview - Get status overview
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getStatusOverviewSchema.safeParse(queryParams);

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

    const { userId, status, dateFrom, dateTo } = validationResult.data;

    // Build query
    let query = supabase
      .from('events')
      .select(
        `
        id,
        title,
        status,
        event_date,
        event_type,
        budget_total,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq('event_manager_id', userId);
    } else {
      // If no userId specified, only show user's own events
      query = query.eq('event_manager_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('event_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('event_date', dateTo);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Calculate status counts
    const statusCounts =
      events?.reduce(
        (acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Calculate total budget by status
    const budgetByStatus =
      events?.reduce(
        (acc, event) => {
          if (!acc[event.status]) {
            acc[event.status] = 0;
          }
          acc[event.status] += event.budget_total || 0;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Calculate upcoming events (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingEvents =
      events?.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate <= thirtyDaysFromNow && eventDate >= new Date();
      }) || [];

    // Calculate overdue events (past due date but not completed/cancelled)
    const overdueEvents =
      events?.filter(event => {
        const eventDate = new Date(event.event_date);
        return (
          eventDate < new Date() &&
          !['completed', 'cancelled'].includes(event.status)
        );
      }) || [];

    const response = {
      events: events || [],
      status_counts: statusCounts,
      budget_by_status: budgetByStatus,
      upcoming_events: upcomingEvents,
      overdue_events: overdueEvents,
      total_events: events?.length || 0,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/events/status/overview:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
