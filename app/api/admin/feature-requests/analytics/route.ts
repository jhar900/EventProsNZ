import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getAnalyticsSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// GET /api/admin/feature-requests/analytics - Get feature request analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getAnalyticsSchema.parse(queryParams);

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    if (validatedParams.start_date && validatedParams.end_date) {
      startDate = new Date(validatedParams.start_date);
      endDate = new Date(validatedParams.end_date);
    } else {
      const range = validatedParams.range || '30d';
      const days =
        range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Get overview statistics
    const { data: overview, error: overviewError } = await supabase
      .from('feature_requests')
      .select('status, priority, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (overviewError) {
      console.error('Error fetching overview stats:', overviewError);
      return NextResponse.json(
        { error: 'Failed to fetch overview statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const total = overview?.length || 0;
    const statusCounts =
      overview?.reduce(
        (acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const priorityCounts =
      overview?.reduce(
        (acc, request) => {
          acc[request.priority] = (acc[request.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get engagement metrics
    const { data: engagement, error: engagementError } = await supabase
      .from('feature_requests')
      .select('vote_count, view_count, comments_count, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (engagementError) {
      console.error('Error fetching engagement metrics:', engagementError);
    }

    const totalVotes =
      engagement?.reduce(
        (sum, request) => sum + (request.vote_count || 0),
        0
      ) || 0;
    const totalViews =
      engagement?.reduce(
        (sum, request) => sum + (request.view_count || 0),
        0
      ) || 0;
    const totalComments =
      engagement?.reduce(
        (sum, request) => sum + (request.comments_count || 0),
        0
      ) || 0;

    // Get trend data (daily counts)
    const { data: trendData, error: trendError } = await supabase
      .from('feature_requests')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendError) {
      console.error('Error fetching trend data:', trendError);
    }

    // Process trend data
    const dailyTrends =
      trendData?.reduce(
        (acc, request) => {
          const date = new Date(request.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = {
              total: 0,
              submitted: 0,
              under_review: 0,
              planned: 0,
              in_development: 0,
              completed: 0,
              rejected: 0,
            };
          }
          acc[date].total++;
          acc[date][request.status] = (acc[date][request.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, any>
      ) || {};

    // Get top categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('feature_requests')
      .select(
        `
        feature_request_categories(name, color),
        created_at
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('category_id', 'is', null);

    if (categoryError) {
      console.error('Error fetching category data:', categoryError);
    }

    const categoryCounts =
      categoryData?.reduce(
        (acc, request) => {
          const categoryName =
            request.feature_request_categories?.name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get top performing requests
    const { data: topRequests, error: topRequestsError } = await supabase
      .from('feature_requests')
      .select(
        `
        id,
        title,
        vote_count,
        view_count,
        comments_count,
        status,
        created_at
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('vote_count', { ascending: false })
      .limit(10);

    if (topRequestsError) {
      console.error('Error fetching top requests:', topRequestsError);
    }

    return NextResponse.json({
      overview: {
        total,
        pending: statusCounts.submitted || 0,
        in_progress:
          (statusCounts.under_review || 0) +
          (statusCounts.planned || 0) +
          (statusCounts.in_development || 0),
        completed: statusCounts.completed || 0,
        rejected: statusCounts.rejected || 0,
      },
      engagement: {
        totalVotes,
        totalViews,
        totalComments,
        averageVotesPerRequest:
          total > 0 ? Math.round((totalVotes / total) * 100) / 100 : 0,
        averageViewsPerRequest:
          total > 0 ? Math.round((totalViews / total) * 100) / 100 : 0,
        averageCommentsPerRequest:
          total > 0 ? Math.round((totalComments / total) * 100) / 100 : 0,
      },
      statusBreakdown: statusCounts,
      priorityBreakdown: priorityCounts,
      categoryBreakdown: categoryCounts,
      trends: {
        daily: dailyTrends,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      topRequests: topRequests || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/feature-requests/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
