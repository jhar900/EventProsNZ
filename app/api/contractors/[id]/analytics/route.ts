import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getAnalyticsSchema = z.object({
  time_range: z.enum(['30d', '90d', '1y']).default('30d'),
});

// GET /api/contractors/[id]/analytics - Get contractor's application analytics
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

    // Verify the contractor is requesting their own analytics or user is admin
    if (id !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view these analytics' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const params_data = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getAnalyticsSchema.parse(params_data);

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

    // Calculate analytics
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

    // Average response time (for applications with responses)
    const respondedApplications =
      applications?.filter(
        app => app.status === 'accepted' || app.status === 'rejected'
      ) || [];

    const averageResponseTime =
      respondedApplications.length > 0
        ? respondedApplications.reduce((sum, app) => {
            const responseTime =
              new Date(app.updated_at).getTime() -
              new Date(app.created_at).getTime();
            return sum + responseTime / (1000 * 60 * 60 * 24); // Convert to days
          }, 0) / respondedApplications.length
        : 0;

    // Applications by month
    const applicationsByMonth =
      applications?.reduce(
        (acc, app) => {
          const month = new Date(app.created_at).toISOString().slice(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const applicationsByMonthArray = Object.entries(applicationsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top job categories
    const jobCategories =
      applications?.reduce(
        (acc, app) => {
          const category = app.job?.service_category || 'unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const topJobCategories = Object.entries(jobCategories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent applications (last 10)
    const recentApplications = applications?.slice(0, 10) || [];

    return NextResponse.json({
      success: true,
      analytics: {
        total_applications: totalApplications,
        applications_by_status: applicationsByStatus,
        applications_by_month: applicationsByMonthArray,
        success_rate: successRate,
        average_response_time: averageResponseTime,
        top_job_categories: topJobCategories,
        recent_applications: recentApplications,
      },
    });
  } catch (error) {
    console.error('GET /api/contractors/[id]/analytics error:', error);

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
          error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
