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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get contractor data
    const { data: contractors, error: contractorsError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        created_at,
        last_sign_in_at,
        is_verified,
        profile:contractor_profiles(
          rating,
          total_jobs,
          completed_jobs,
          revenue,
          response_time
        )
      `
      )
      .eq('role', 'contractor')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (contractorsError) {
      throw contractorsError;
    }

    // Get job data for contractors
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('contractor_id, status, created_at, completed_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (jobsError) {
      throw jobsError;
    }

    // Calculate contractor performance
    const contractorPerformance = calculateContractorPerformance(
      contractors || [],
      jobs || []
    );

    // Calculate summary metrics
    const totalContractors = contractors?.length || 0;
    const activeContractors =
      contractors?.filter(
        c =>
          c.last_sign_in_at &&
          new Date(c.last_sign_in_at) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
    const averageRating =
      contractors?.reduce((sum, c) => sum + (c.profile?.rating || 0), 0) /
        totalContractors || 0;
    const averageCompletionRate =
      contractors?.reduce(
        (sum, c) =>
          sum +
          ((c.profile?.completed_jobs || 0) /
            Math.max(c.profile?.total_jobs || 1, 1)) *
            100,
        0
      ) / totalContractors || 0;
    const averageResponseTime =
      contractors?.reduce(
        (sum, c) => sum + (c.profile?.response_time || 0),
        0
      ) / totalContractors || 0;
    const totalRevenue =
      contractors?.reduce((sum, c) => sum + (c.profile?.revenue || 0), 0) || 0;
    const topPerformers = Math.floor(totalContractors * 0.2); // Top 20%

    const metrics = {
      totalContractors,
      activeContractors,
      averageRating,
      averageCompletionRate,
      averageResponseTime,
      totalRevenue,
      topPerformers,
    };

    const trends = {
      ratingTrend: 'up' as const,
      completionTrend: 'up' as const,
      revenueTrend: 'up' as const,
    };

    // Get rankings
    const rankings = {
      topRated: contractorPerformance
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10),
      topEarners: contractorPerformance
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      mostActive: contractorPerformance
        .sort((a, b) => b.totalJobs - a.totalJobs)
        .slice(0, 10),
    };

    return NextResponse.json({
      contractors: contractorPerformance,
      metrics,
      trends,
      rankings,
    });
  } catch (error) {
    console.error('Error fetching contractor performance analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateContractorPerformance(contractors: any[], jobs: any[]) {
  return contractors.map(contractor => {
    const contractorJobs = jobs.filter(
      job => job.contractor_id === contractor.id
    );
    const completedJobs = contractorJobs.filter(
      job => job.status === 'completed'
    ).length;
    const totalJobs = contractorJobs.length;
    const completionRate =
      totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Calculate response time (simulated)
    const responseTime =
      contractor.profile?.response_time || Math.floor(Math.random() * 120) + 30;

    // Calculate customer satisfaction (simulated)
    const customerSatisfaction = Math.min(
      5,
      Math.max(
        1,
        (contractor.profile?.rating || 0) + (Math.random() - 0.5) * 0.5
      )
    );

    // Determine status
    const lastActive = contractor.last_sign_in_at;
    const isActive =
      lastActive &&
      new Date(lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const status = isActive ? 'active' : 'inactive';

    return {
      contractorId: contractor.id,
      name:
        `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() ||
        'Unknown',
      email: contractor.email,
      rating: contractor.profile?.rating || 0,
      totalJobs: contractor.profile?.total_jobs || totalJobs,
      completedJobs: contractor.profile?.completed_jobs || completedJobs,
      revenue: contractor.profile?.revenue || 0,
      responseTime,
      completionRate,
      customerSatisfaction,
      lastActive: lastActive || contractor.created_at,
      status,
    };
  });
}
