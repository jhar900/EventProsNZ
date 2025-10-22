import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

// Initialize Redis client for caching (only in production)
let redis: any = null;
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    const { Redis } = require('ioredis');
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.warn('Redis not available:', error);
  }
}

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
    const period = searchParams.get('period') || '30d';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Create cache key based on parameters
    const cacheKey = `analytics:${user.id}:${period}:${dateFrom || ''}:${dateTo || ''}`;

    // Try to get cached data first (if Redis is available)
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.warn('Redis cache error:', cacheError);
        // Continue with database queries if cache fails
      }
    }

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
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = dateFrom
          ? new Date(dateFrom)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = dateTo ? new Date(dateTo) : now;

    // Validate date parameters
    if (dateFrom && isNaN(new Date(dateFrom).getTime())) {
      return NextResponse.json(
        { error: 'Invalid date_from parameter' },
        { status: 400 }
      );
    }

    if (dateTo && isNaN(new Date(dateTo).getTime())) {
      return NextResponse.json(
        { error: 'Invalid date_to parameter' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'start_date cannot be after end_date' },
        { status: 400 }
      );
    }

    // Get job board analytics
    const [
      { data: totalJobs, count: totalJobsCount },
      { data: activeJobs, count: activeJobsCount },
      { data: totalApplications, count: totalApplicationsCount },
      { data: completedJobs, count: completedJobsCount },
    ] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
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

    // Get geographic distribution
    const { data: geographicData } = await supabase
      .from('jobs')
      .select('location, job_applications(count)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get category performance
    const { data: categoryData } = await supabase
      .from('jobs')
      .select('category, budget, job_applications(count)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get trends data
    const { data: trendsData } = await supabase
      .from('jobs')
      .select('created_at, job_applications(count)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Get top performing jobs
    const { data: topJobs } = await supabase
      .from('jobs')
      .select('id, title, job_applications(count), views_count')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('views_count', { ascending: false })
      .limit(10);

    // Calculate metrics
    const conversionRate =
      totalApplicationsCount && totalJobsCount
        ? (totalApplicationsCount / totalJobsCount) * 100
        : 0;

    const averageTimeToFill = await calculateAverageTimeToFill(
      supabase,
      startDate,
      endDate
    );
    const userSatisfaction = await calculateUserSatisfaction(
      supabase,
      startDate,
      endDate
    );
    const totalRevenue = await calculateTotalRevenue(
      supabase,
      startDate,
      endDate
    );

    // Process geographic distribution
    const geographicDistribution = processGeographicData(geographicData || []);

    // Process category performance
    const categories = processCategoryData(categoryData || []);

    // Process trends
    const trends = processTrendsData(trendsData || [], period);

    // Process top performing jobs
    const topPerformingJobs = (topJobs || []).map(job => ({
      id: job.id,
      title: job.title,
      applications: job.job_applications?.[0]?.count || 0,
      views: job.views_count || 0,
      conversionRate: job.views_count
        ? ((job.job_applications?.[0]?.count || 0) / job.views_count) * 100
        : 0,
    }));

    const overview = {
      totalJobs: totalJobsCount || 0,
      activeJobs: activeJobsCount || 0,
      totalApplications: totalApplicationsCount || 0,
      conversionRate,
      averageTimeToFill,
      userSatisfaction,
      totalRevenue,
      geographicDistribution,
    };

    const performance = {
      topPerformingJobs,
      userEngagement: {
        averageSessionTime: 0, // Would need to calculate from user activity
        pageViews: 0, // Would need to calculate from analytics
        bounceRate: 0, // Would need to calculate from analytics
      },
    };

    const responseData = {
      overview,
      trends,
      categories,
      performance,
      period,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    };

    // Cache the response data for 5 minutes (if Redis is available)
    if (redis) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(responseData));
      } catch (cacheError) {
        console.warn('Failed to cache analytics data:', cacheError);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching job board analytics:', error);

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

async function calculateAverageTimeToFill(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data } = await supabase
      .from('jobs')
      .select('created_at, updated_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!data || data.length === 0) return 0;

    const totalDays = data.reduce((sum, job) => {
      const created = new Date(job.created_at);
      const completed = new Date(job.updated_at);
      const days = Math.ceil(
        (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / data.length);
  } catch (error) {
    console.error('Error calculating average time to fill:', error);
    return 0;
  }
}

async function calculateUserSatisfaction(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data } = await supabase
      .from('user_satisfaction')
      .select('rating')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!data || data.length === 0) return 0;

    const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
    return totalRating / data.length;
  } catch (error) {
    console.error('Error calculating user satisfaction:', error);
    return 0;
  }
}

async function calculateTotalRevenue(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data } = await supabase
      .from('jobs')
      .select('budget')
      .eq('status', 'completed')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (!data || data.length === 0) return 0;

    return data.reduce((sum, job) => sum + (job.budget || 0), 0);
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    return 0;
  }
}

function processGeographicData(
  data: any[]
): Array<{ location: string; jobs: number; applications: number }> {
  const locationMap = new Map();

  data.forEach(item => {
    const location = item.location;
    if (!locationMap.has(location)) {
      locationMap.set(location, { location, jobs: 0, applications: 0 });
    }

    const locationData = locationMap.get(location);
    locationData.jobs += 1;
    locationData.applications += item.job_applications?.[0]?.count || 0;
  });

  return Array.from(locationMap.values());
}

function processCategoryData(data: any[]): Array<{
  name: string;
  jobs: number;
  applications: number;
  conversionRate: number;
  averageBudget: number;
}> {
  const categoryMap = new Map();

  data.forEach(item => {
    const category = item.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category,
        jobs: 0,
        applications: 0,
        totalBudget: 0,
      });
    }

    const categoryData = categoryMap.get(category);
    categoryData.jobs += 1;
    categoryData.applications += item.job_applications?.[0]?.count || 0;
    categoryData.totalBudget += item.budget || 0;
  });

  return Array.from(categoryMap.values()).map(category => ({
    name: category.name,
    jobs: category.jobs,
    applications: category.applications,
    conversionRate:
      category.jobs > 0 ? (category.applications / category.jobs) * 100 : 0,
    averageBudget: category.jobs > 0 ? category.totalBudget / category.jobs : 0,
  }));
}

function processTrendsData(
  data: any[],
  period: string
): {
  jobPostings: Array<{ date: string; count: number }>;
  applications: Array<{ date: string; count: number }>;
  conversions: Array<{ date: string; rate: number }>;
  satisfaction: Array<{ date: string; rating: number }>;
} {
  // This would need to be implemented based on the specific requirements
  // For now, returning empty arrays as placeholders
  return {
    jobPostings: [],
    applications: [],
    conversions: [],
    satisfaction: [],
  };
}
