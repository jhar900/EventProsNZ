import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';

    // Validate parameters
    const limit = parseInt(limitParam);
    const offset = parseInt(offsetParam);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be non-negative' },
        { status: 400 }
      );
    }

    // Accept both component status values and database status values
    const validStatuses = [
      'all',
      'pending',
      'approved',
      'rejected',
      'flagged',
      'active',
      'filled',
      'completed',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            'Invalid status parameter. Must be one of: all, pending, approved, rejected, flagged, active, filled, completed, cancelled',
        },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS and get all jobs
    // Build query to get all jobs with user information
    // First, get all jobs
    let query = supabaseAdmin
      .from('jobs')
      .select(
        `
        id,
        title,
        description,
        location,
        budget_range_min,
        budget_range_max,
        timeline_start_date,
        timeline_end_date,
        status,
        created_at,
        updated_at,
        posted_by_user_id,
        service_category,
        view_count,
        application_count
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter - map component status values to database status values
    // Component uses: pending, approved, rejected, flagged
    // Database uses: active, filled, completed, cancelled
    if (status !== 'all') {
      // Map component status to database status
      const statusMap: Record<string, string> = {
        pending: 'active', // Active jobs are considered pending moderation
        approved: 'active',
        rejected: 'cancelled',
        flagged: 'active', // Flagged jobs are still active
      };
      const dbStatus = statusMap[status] || status;
      query = query.eq('status', dbStatus);
    }

    const { data: jobs, error: jobsError } = await query;

    console.log('Jobs query result:', {
      count: jobs?.length || 0,
      error: jobsError?.message,
      sample: jobs?.[0],
    });

    if (jobsError) {
      console.error('Error fetching jobs for moderation:', jobsError);

      // Enhanced error handling for database errors
      if (jobsError.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error' },
          { status: 503 }
        );
      }

      if (jobsError.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database query timeout' },
          { status: 408 }
        );
      }

      if (jobsError.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Database permission error' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    // Fetch user information for all jobs
    const userIds = [
      ...new Set(
        (jobs || []).map(job => job.posted_by_user_id).filter(Boolean)
      ),
    ];
    const userMap = new Map();

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select(
          `
          id,
          email,
          profiles(
            first_name,
            last_name
          )
        `
        )
        .in('id', userIds);

      if (!usersError && usersData) {
        usersData.forEach(user => {
          const profile = Array.isArray(user.profiles)
            ? user.profiles[0]
            : user.profiles;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';
          const userName =
            firstName && lastName
              ? `${firstName} ${lastName}`.trim()
              : firstName || lastName || 'Unknown User';

          userMap.set(user.id, {
            email: user.email,
            name: userName,
          });
        });
      }
    }

    // Transform data to match expected format
    const transformedJobs = (jobs || []).map(job => {
      const userInfo = userMap.get(job.posted_by_user_id) || {
        email: 'unknown@example.com',
        name: 'Unknown User',
      };

      // Calculate budget (use max if available, otherwise min, otherwise 0)
      const budget = job.budget_range_max || job.budget_range_min || 0;

      // Use timeline_start_date as event_date, fallback to created_at
      const eventDate = job.timeline_start_date || job.created_at;

      // Map database status to component status
      // Database: active, filled, completed, cancelled
      // Component: pending, approved, rejected, flagged
      const statusMap: Record<
        string,
        'pending' | 'approved' | 'rejected' | 'flagged'
      > = {
        active: 'pending', // Active jobs are pending moderation
        filled: 'approved', // Filled jobs are approved/completed
        completed: 'approved',
        cancelled: 'rejected',
      };
      const componentStatus = statusMap[job.status || 'active'] || 'pending';

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        budget: budget,
        event_date: eventDate,
        status: componentStatus,
        quality_score: 0, // Not in schema, default to 0
        created_at: job.created_at,
        updated_at: job.updated_at,
        user_id: job.posted_by_user_id,
        user_name: userInfo.name,
        user_email: userInfo.email,
        category: job.service_category || 'Uncategorized',
        urgency: 'medium', // Not in schema, default to medium
        applications_count: job.application_count || 0,
        views_count: job.view_count || 0,
        flags: [], // job_flags table might not exist, default to empty array
      };
    });

    return NextResponse.json({
      jobs: transformedJobs,
      total: transformedJobs.length,
      hasMore: transformedJobs.length === limit,
    });
  } catch (error) {
    console.error('Error fetching jobs for moderation:', error);

    // Enhanced error handling for different error types
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
