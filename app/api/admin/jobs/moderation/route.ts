import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
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

    if (
      !['all', 'pending', 'active', 'completed', 'cancelled'].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid status parameter. Must be one of: all, pending, active, completed, cancelled',
        },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        description,
        location,
        budget,
        event_date,
        status,
        quality_score,
        created_at,
        updated_at,
        user_id,
        category,
        urgency,
        applications_count,
        views_count,
        users!inner(
          id,
          name,
          email
        ),
        job_flags(
          id,
          reason,
          flagged_by,
          flagged_at
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, error: jobsError } = await query;

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

    // Transform data to match expected format
    const transformedJobs = (jobs || []).map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      budget: job.budget,
      event_date: job.event_date,
      status: job.status,
      quality_score: job.quality_score || 0,
      created_at: job.created_at,
      updated_at: job.updated_at,
      user_id: job.user_id,
      user_name: job.users?.name || 'Unknown',
      user_email: job.users?.email || 'unknown@example.com',
      category: job.category,
      urgency: job.urgency || 'medium',
      applications_count: job.applications_count || 0,
      views_count: job.views_count || 0,
      flags: job.job_flags || [],
    }));

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
