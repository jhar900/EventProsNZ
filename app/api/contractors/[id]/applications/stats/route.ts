import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getStatsSchema = z.object({
  time_range: z.enum(['30d', '90d', '1y']).default('30d'),
});

// GET /api/contractors/[id]/applications/stats - Get contractor's application statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Verify the contractor is requesting their own stats or user is admin
    if (id !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view these stats' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const params_data = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getStatsSchema.parse(params_data);

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (parsedParams.time_range) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get applications within date range
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select(
        `
        *,
        job:jobs!job_applications_job_id_fkey(
          id,
          title,
          service_category,
          status
        )
      `
      )
      .eq('contractor_id', id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (applicationsError) {
      throw new Error(
        `Failed to fetch applications: ${applicationsError.message}`
      );
    }

    // Calculate statistics
    const totalApplications = applications?.length || 0;

    // Applications by status
    const applicationsByStatus = {
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
    };

    applications?.forEach(app => {
      applicationsByStatus[app.status as keyof typeof applicationsByStatus]++;
    });

    // Success rate (accepted / total)
    const successRate =
      totalApplications > 0
        ? (applicationsByStatus.accepted / totalApplications) * 100
        : 0;

    // Monthly trend (compare current month to previous month)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthApps =
      applications?.filter(app => new Date(app.created_at) >= currentMonth)
        .length || 0;

    const { data: previousMonthApps } = await supabase
      .from('job_applications')
      .select('id')
      .eq('contractor_id', id)
      .gte('created_at', previousMonth.toISOString())
      .lte('created_at', previousMonthEnd.toISOString());

    const previousMonthCount = previousMonthApps?.length || 0;
    const monthlyTrend =
      previousMonthCount > 0
        ? ((currentMonthApps - previousMonthCount) / previousMonthCount) * 100
        : currentMonthApps > 0
          ? 100
          : 0;

    // Recent applications (last 10)
    const recentApplications = applications?.slice(0, 10) || [];

    return NextResponse.json({
      success: true,
      stats: {
        total_applications: totalApplications,
        success_rate: successRate,
        applications_by_status: applicationsByStatus,
        recent_applications: recentApplications,
        monthly_trend: monthlyTrend,
      },
    });
  } catch (error) {
    console.error('GET /api/contractors/[id]/applications/stats error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch application stats',
      },
      { status: 500 }
    );
  }
}
