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
    const period = searchParams.get('period') || '24h';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get real-time metrics
    const [
      { data: activeJobs, count: activeJobsCount },
      { data: pendingJobs, count: pendingJobsCount },
      { data: recentApplications, count: recentApplicationsCount },
      { data: completedJobs, count: completedJobsCount },
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startDate.toISOString()),
    ]);

    // Get conversion metrics
    const { data: conversionData } = await supabase
      .from('jobs')
      .select('id, job_applications(count)')
      .eq('status', 'completed')
      .gte('updated_at', startDate.toISOString());

    const totalApplications =
      conversionData?.reduce(
        (sum, job) => sum + (job.job_applications?.[0]?.count || 0),
        0
      ) || 0;

    const conversionRate =
      completedJobsCount && totalApplications
        ? (completedJobsCount / totalApplications) * 100
        : 0;

    // Get user activity metrics
    const { data: userActivity } = await supabase
      .from('users')
      .select('id, last_login_at')
      .gte('last_login_at', startDate.toISOString());

    const activeUsers = userActivity?.length || 0;

    // Get geographic distribution
    const { data: geographicData } = await supabase
      .from('jobs')
      .select('location')
      .gte('created_at', startDate.toISOString());

    const locationCounts = (geographicData || []).reduce(
      (acc, job) => {
        const location = job.location || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Get category distribution
    const { data: categoryData } = await supabase
      .from('jobs')
      .select('category')
      .gte('created_at', startDate.toISOString());

    const categoryCounts = (categoryData || []).reduce(
      (acc, job) => {
        const category = job.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Get satisfaction metrics
    const { data: satisfactionData } = await supabase
      .from('user_satisfaction')
      .select('rating')
      .gte('created_at', startDate.toISOString());

    const averageSatisfaction = satisfactionData?.length
      ? satisfactionData.reduce((sum, item) => sum + item.rating, 0) /
        satisfactionData.length
      : 0;

    // Get time-based trends (hourly for 24h, daily for longer periods)
    const trends = await getTimeBasedTrends(supabase, startDate, period);

    const metrics = {
      overview: {
        activeJobs: activeJobsCount || 0,
        pendingJobs: pendingJobsCount || 0,
        recentApplications: recentApplicationsCount || 0,
        completedJobs: completedJobsCount || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        activeUsers,
        averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      },
      distribution: {
        topLocations,
        topCategories,
      },
      trends,
      period,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching job board metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getTimeBasedTrends(
  supabase: any,
  startDate: Date,
  period: string
) {
  try {
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('created_at, job_applications(count)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const { data: applicationsData } = await supabase
      .from('job_applications')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group data by time buckets based on period
    const timeBuckets = getTimeBuckets(startDate, period);
    const trends = timeBuckets.map(bucket => ({
      timestamp: bucket.toISOString(),
      jobs: 0,
      applications: 0,
    }));

    // Process jobs data
    (jobsData || []).forEach(job => {
      const jobDate = new Date(job.created_at);
      const bucketIndex = getBucketIndex(jobDate, startDate, period);
      if (bucketIndex >= 0 && bucketIndex < trends.length) {
        trends[bucketIndex].jobs += 1;
      }
    });

    // Process applications data
    (applicationsData || []).forEach(application => {
      const appDate = new Date(application.created_at);
      const bucketIndex = getBucketIndex(appDate, startDate, period);
      if (bucketIndex >= 0 && bucketIndex < trends.length) {
        trends[bucketIndex].applications += 1;
      }
    });

    return trends;
  } catch (error) {
    console.error('Error calculating trends:', error);
    return [];
  }
}

function getTimeBuckets(startDate: Date, period: string): Date[] {
  const buckets: Date[] = [];
  const now = new Date();

  switch (period) {
    case '1h':
      // 12 buckets of 5 minutes each
      for (let i = 0; i < 12; i++) {
        buckets.push(new Date(startDate.getTime() + i * 5 * 60 * 1000));
      }
      break;
    case '24h':
      // 24 buckets of 1 hour each
      for (let i = 0; i < 24; i++) {
        buckets.push(new Date(startDate.getTime() + i * 60 * 60 * 1000));
      }
      break;
    case '7d':
      // 7 buckets of 1 day each
      for (let i = 0; i < 7; i++) {
        buckets.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
      }
      break;
    case '30d':
      // 30 buckets of 1 day each
      for (let i = 0; i < 30; i++) {
        buckets.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
      }
      break;
    default:
      // Default to 24 hours
      for (let i = 0; i < 24; i++) {
        buckets.push(new Date(startDate.getTime() + i * 60 * 60 * 1000));
      }
  }

  return buckets;
}

function getBucketIndex(date: Date, startDate: Date, period: string): number {
  const diff = date.getTime() - startDate.getTime();

  switch (period) {
    case '1h':
      return Math.floor(diff / (5 * 60 * 1000));
    case '24h':
      return Math.floor(diff / (60 * 60 * 1000));
    case '7d':
    case '30d':
      return Math.floor(diff / (24 * 60 * 60 * 1000));
    default:
      return Math.floor(diff / (60 * 60 * 1000));
  }
}
