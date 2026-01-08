import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { DashboardQuerySchema } from '@/lib/validation/eventValidation';
import {
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/errorHandler';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { DashboardCacheService } from '@/lib/cache/dashboardCache';

// GET /api/events/dashboard - Get event dashboard data with pagination and optimization
async function getDashboardHandler(request: NextRequest) {
  // Try to get user ID from header first (sent by client)
  let userId = request.headers.get('x-user-id');

  let user;

  if (!userId) {
    // Fallback to cookie-based auth using middleware client
    try {
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user: authUser },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      // Handle refresh token errors gracefully
      if (authError) {
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token')
        ) {
          return createErrorResponse(
            'Session expired. Please log in again.',
            401
          );
        }
        return createErrorResponse('Unauthorized', 401);
      }

      if (!authUser) {
        return createErrorResponse('Unauthorized', 401);
      }

      user = authUser;
      userId = authUser.id;
    } catch (error: any) {
      console.error('Auth error in GET /api/events/dashboard:', error);
      return createErrorResponse(
        'Authentication failed. Please log in again.',
        401
      );
    }
  } else {
    user = { id: userId };
  }

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  // Validate input
  const validationResult = DashboardQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return createErrorResponse(
      'Invalid query parameters',
      400,
      validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    );
  }

  const { userId: queryUserId, period, page, limit } = validationResult.data;
  const targetUserId = queryUserId || user.id;
  const offset = (page - 1) * limit;

  // Check cache first
  const cacheKey = `${targetUserId}:${period}:${page}:${limit}`;
  const cachedData = await DashboardCacheService.getCachedDashboardData(
    targetUserId,
    period,
    page,
    limit
  );

  if (cachedData) {
    return createSuccessResponse(cachedData);
  }

  // Calculate date range based on period
  const now = new Date();
  let dateFrom: Date;

  switch (period) {
    case 'week':
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get total count of all events (without date filter) for dashboard display
  // Note: events table uses user_id, not event_manager_id
  const { count: totalCount } = await supabaseAdmin
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetUserId);

  // Optimized query with pagination and selective field loading
  // Use left joins for milestones and feedback so events without them are still returned
  // Note: events table uses user_id, not event_manager_id
  const {
    data: events,
    error: eventsError,
    count,
  } = await supabaseAdmin
    .from('events')
    .select(
      `
      id,
      title,
      status,
      event_date,
      budget_total,
      event_type,
      created_at,
      updated_at,
      event_milestones(id, milestone_name, status),
      event_feedback(id, rating)
    `,
      { count: 'exact' }
    )
    .eq('user_id', targetUserId)
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventsError) {
    return createErrorResponse('Failed to fetch events', 500);
  }

  // Calculate dashboard metrics efficiently
  // Use totalCount (all events) for the total, but count (filtered) for pagination
  const totalEvents = totalCount || 0;
  const filteredEventsCount = count || 0;
  const totalBudget =
    events?.reduce((sum, event) => sum + (event.budget_total || 0), 0) || 0;

  // Status breakdown
  const statusBreakdown =
    events?.reduce(
      (acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Budget by status
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

  // Event type breakdown
  const eventTypeBreakdown =
    events?.reduce(
      (acc, event) => {
        const eventType = event.event_type || 'other';
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Upcoming events (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcomingEvents =
    events?.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate <= thirtyDaysFromNow && eventDate >= now;
    }) || [];

  // Overdue events
  const overdueEvents =
    events?.filter(event => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate < now && !['completed', 'cancelled'].includes(event.status)
      );
    }) || [];

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity =
    events?.filter(event => new Date(event.updated_at) >= sevenDaysAgo) || [];

  // Milestone statistics
  const totalMilestones =
    events?.reduce(
      (sum, event) => sum + (event.event_milestones?.length || 0),
      0
    ) || 0;

  const completedMilestones =
    events?.reduce(
      (sum, event) =>
        sum +
        (event.event_milestones?.filter(m => m.status === 'completed').length ||
          0),
      0
    ) || 0;

  // Feedback statistics
  const totalFeedback =
    events?.reduce(
      (sum, event) => sum + (event.event_feedback?.length || 0),
      0
    ) || 0;

  const averageRating =
    events?.reduce((sum, event) => {
      const eventFeedback = event.event_feedback || [];
      const eventRating =
        eventFeedback.length > 0
          ? eventFeedback.reduce(
              (eventSum, feedback) => eventSum + feedback.rating,
              0
            ) / eventFeedback.length
          : 0;
      return sum + eventRating;
    }, 0) / (events?.length || 1) || 0;

  const dashboard = {
    total_events: totalEvents,
    total_budget: totalBudget,
    status_breakdown: statusBreakdown,
    budget_by_status: budgetByStatus,
    event_type_breakdown: eventTypeBreakdown,
    upcoming_events: upcomingEvents.length,
    overdue_events: overdueEvents.length,
    recent_activity: recentActivity.length,
    milestones: {
      total: totalMilestones,
      completed: completedMilestones,
      completion_rate:
        totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
    },
    feedback: {
      total: totalFeedback,
      average_rating: Math.round(averageRating * 10) / 10,
    },
    period,
    date_from: dateFrom.toISOString(),
    date_to: now.toISOString(),
    pagination: {
      page,
      limit,
      total: totalEvents,
      total_pages: Math.ceil(totalEvents / limit),
    },
  };

  const responseData = {
    dashboard,
    events: events || [],
    total: totalEvents, // Total count of all events (for dashboard display)
    pagination: {
      page,
      limit,
      total: filteredEventsCount, // Count of filtered events (for pagination)
      total_pages: Math.ceil(filteredEventsCount / limit),
    },
  };

  // Cache the response
  await DashboardCacheService.setCachedDashboardData(
    targetUserId,
    period,
    page,
    limit,
    responseData,
    300 // 5 minutes cache
  );

  return createSuccessResponse(responseData);
}

// Export the rate-limited and error-handled endpoint
export const GET = withRateLimit(
  'dashboard',
  withErrorHandling(getDashboardHandler)
);
