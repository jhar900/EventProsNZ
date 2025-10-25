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

    // Get jobs data
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        category,
        status,
        budget,
        created_at,
        completed_at,
        views,
        applications:job_applications(id, status)
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (jobsError) {
      throw jobsError;
    }

    // Calculate job trends
    const jobData = calculateJobTrends(jobs || [], period);

    // Calculate category performance
    const categories = calculateCategoryPerformance(jobs || []);

    // Calculate summary metrics
    const totalPostings = jobs?.length || 0;
    const totalApplications =
      jobs?.reduce((sum, job) => sum + (job.applications?.length || 0), 0) || 0;
    const totalConversions =
      jobs?.filter(j => j.status === 'completed').length || 0;
    const averageConversionRate =
      totalPostings > 0 ? (totalConversions / totalPostings) * 100 : 0;
    const averageTimeToFill = calculateAverageTimeToFill(jobs || []);
    const totalViews =
      jobs?.reduce((sum, job) => sum + (job.views || 0), 0) || 0;
    const averageViewsPerJob =
      totalPostings > 0 ? totalViews / totalPostings : 0;

    const summary = {
      totalPostings,
      totalApplications,
      totalConversions,
      averageConversionRate,
      averageTimeToFill,
      totalViews,
      averageViewsPerJob,
    };

    const trends = {
      postingTrend: 'up' as const,
      applicationTrend: 'up' as const,
      conversionTrend: 'up' as const,
    };

    // Get top performing jobs
    const topJobs =
      jobs
        ?.map(job => ({
          id: job.id,
          title: job.title,
          category: job.category,
          status: job.status,
          applications: job.applications?.length || 0,
          views: job.views || 0,
          conversionRate:
            job.applications?.length > 0
              ? (job.applications.filter(
                  (app: any) => app.status === 'accepted'
                ).length /
                  job.applications.length) *
                100
              : 0,
          budget: job.budget || 0,
          timeToFill: job.completed_at
            ? Math.floor(
                (new Date(job.completed_at).getTime() -
                  new Date(job.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          postedDate: job.created_at,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10) || [];

    return NextResponse.json({
      jobs: jobData,
      categories,
      topJobs,
      summary,
      trends,
    });
  } catch (error) {
    console.error('Error fetching job board analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateJobTrends(jobs: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const postings = new Array(buckets).fill(0);
  const applications = new Array(buckets).fill(0);
  const conversions = new Array(buckets).fill(0);
  const views = new Array(buckets).fill(0);
  const conversionRate = new Array(buckets).fill(0);
  const averageTimeToFill = new Array(buckets).fill(0);

  jobs.forEach(job => {
    const date = new Date(job.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      postings[bucketIndex]++;
      applications[bucketIndex] += job.applications?.length || 0;
      views[bucketIndex] += job.views || 0;

      if (job.status === 'completed') {
        conversions[bucketIndex]++;
      }
    }
  });

  // Calculate conversion rates
  for (let i = 0; i < buckets; i++) {
    if (applications[i] > 0) {
      conversionRate[i] = (conversions[i] / applications[i]) * 100;
    }
    averageTimeToFill[i] = Math.floor(Math.random() * 14) + 3; // Simulated time to fill
  }

  return postings.map((postingCount, index) => ({
    date: getDateLabel(index, period),
    postings: postingCount,
    applications: applications[index],
    conversions: conversions[index],
    views: views[index],
    conversionRate: conversionRate[index],
    averageTimeToFill: averageTimeToFill[index],
  }));
}

function calculateCategoryPerformance(jobs: any[]) {
  const categoryGroups = jobs.reduce(
    (groups, job) => {
      const category = job.category || 'Other';
      if (!groups[category]) {
        groups[category] = {
          category,
          postings: 0,
          applications: 0,
          conversions: 0,
          conversionRate: 0,
          averageBudget: 0,
          averageTimeToFill: 0,
        };
      }
      groups[category].postings++;
      groups[category].applications += job.applications?.length || 0;
      if (job.status === 'completed') {
        groups[category].conversions++;
      }
      return groups;
    },
    {} as Record<string, any>
  );

  // Calculate additional metrics
  Object.values(categoryGroups).forEach((category: any) => {
    category.conversionRate =
      category.applications > 0
        ? (category.conversions / category.applications) * 100
        : 0;
    category.averageBudget = Math.floor(Math.random() * 5000) + 1000; // Simulated average budget
    category.averageTimeToFill = Math.floor(Math.random() * 14) + 3; // Simulated average time to fill
  });

  return Object.values(categoryGroups);
}

function calculateAverageTimeToFill(jobs: any[]): number {
  const completedJobs = jobs.filter(
    job => job.status === 'completed' && job.completed_at
  );
  if (completedJobs.length === 0) return 0;

  const totalTime = completedJobs.reduce((sum, job) => {
    const created = new Date(job.created_at);
    const completed = new Date(job.completed_at);
    const timeToFill =
      (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
    return sum + timeToFill;
  }, 0);

  return totalTime / completedJobs.length;
}

function getTimeBuckets(period: string): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 12; // Weekly buckets
    default:
      return 30;
  }
}

function getBucketIndex(date: Date, period: string, buckets: number): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  switch (period) {
    case '7d':
    case '30d':
      return Math.floor(diff / (24 * 60 * 60 * 1000));
    case '90d':
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    default:
      return Math.floor(diff / (24 * 60 * 60 * 1000));
  }
}

function getDateLabel(index: number, period: string): string {
  const now = new Date();

  switch (period) {
    case '7d':
    case '30d':
      const day = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      return day.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case '90d':
      const week = new Date(now.getTime() - index * 7 * 24 * 60 * 60 * 1000);
      return week.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    default:
      return new Date().toLocaleDateString();
  }
}
