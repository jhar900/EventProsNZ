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
    const format = searchParams.get('format') || 'pdf';
    const type = searchParams.get('type') || 'analytics';
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
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Generate report based on type
    let reportData;
    switch (type) {
      case 'analytics':
        reportData = await generateAnalyticsReport(supabase, startDate, now);
        break;
      case 'conversion':
        reportData = await generateConversionReport(supabase, startDate, now);
        break;
      case 'geographic':
        reportData = await generateGeographicReport(supabase, startDate, now);
        break;
      case 'satisfaction':
        reportData = await generateSatisfactionReport(supabase, startDate, now);
        break;
      default:
        reportData = await generateAnalyticsReport(supabase, startDate, now);
    }

    // Generate file based on format
    if (format === 'pdf') {
      return generatePDFReport(reportData, type, period);
    } else if (format === 'excel') {
      return generateExcelReport(reportData, type, period);
    } else if (format === 'csv') {
      return generateCSVReport(reportData, type, period);
    } else {
      return NextResponse.json({
        success: true,
        data: reportData,
        type,
        period,
        generated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAnalyticsReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  // Get comprehensive analytics data
  const [
    { data: jobs, count: totalJobs },
    { data: applications, count: totalApplications },
    { data: users, count: totalUsers },
    { data: completedJobs, count: completedJobsCount },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString()),
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

  return {
    summary: {
      totalJobs: totalJobs || 0,
      totalApplications: totalApplications || 0,
      totalUsers: totalUsers || 0,
      completedJobs: completedJobsCount || 0,
      conversionRate: totalApplications
        ? ((completedJobsCount || 0) / totalApplications) * 100
        : 0,
    },
    geographic: processGeographicData(geographicData || []),
    categories: processCategoryData(categoryData || []),
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
}

async function generateConversionReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  // Get conversion-specific data
  const { data: conversionData } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      created_at,
      updated_at,
      status,
      job_applications(count),
      views_count
    `
    )
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const conversions = (conversionData || []).map(job => ({
    jobId: job.id,
    title: job.title,
    created: job.created_at,
    completed: job.updated_at,
    status: job.status,
    applications: job.job_applications?.[0]?.count || 0,
    views: job.views_count || 0,
    timeToComplete:
      job.status === 'completed'
        ? Math.ceil(
            (new Date(job.updated_at).getTime() -
              new Date(job.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
  }));

  const completedJobs = conversions.filter(job => job.status === 'completed');
  const averageTimeToComplete =
    completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.timeToComplete || 0), 0) /
        completedJobs.length
      : 0;

  return {
    conversions,
    metrics: {
      totalJobs: conversions.length,
      completedJobs: completedJobs.length,
      averageTimeToComplete: Math.round(averageTimeToComplete),
      conversionRate:
        conversions.length > 0
          ? (completedJobs.length / conversions.length) * 100
          : 0,
    },
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
}

async function generateGeographicReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  // Get geographic distribution data
  const { data: jobs } = await supabase
    .from('jobs')
    .select('location, category, budget, job_applications(count)')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const locationMap = new Map();

  (jobs || []).forEach(job => {
    const location = job.location || 'Unknown';
    if (!locationMap.has(location)) {
      locationMap.set(location, {
        location,
        jobs: 0,
        applications: 0,
        totalBudget: 0,
        categories: new Set(),
      });
    }

    const locationData = locationMap.get(location);
    locationData.jobs += 1;
    locationData.applications += job.job_applications?.[0]?.count || 0;
    locationData.totalBudget += job.budget || 0;
    locationData.categories.add(job.category);
  });

  const geographicData = Array.from(locationMap.values()).map(location => ({
    location: location.location,
    jobs: location.jobs,
    applications: location.applications,
    averageBudget: location.jobs > 0 ? location.totalBudget / location.jobs : 0,
    categories: Array.from(location.categories),
    conversionRate:
      location.jobs > 0 ? (location.applications / location.jobs) * 100 : 0,
  }));

  return {
    locations: geographicData,
    totalLocations: geographicData.length,
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
}

async function generateSatisfactionReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  // Get satisfaction data
  const { data: satisfactionData } = await supabase
    .from('user_satisfaction')
    .select('rating, feedback, created_at, job_id, users(name)')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const ratings = (satisfactionData || []).map(item => item.rating);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: ratings.filter(r => r === rating).length,
    percentage:
      ratings.length > 0
        ? (ratings.filter(r => r === rating).length / ratings.length) * 100
        : 0,
  }));

  return {
    totalResponses: satisfactionData?.length || 0,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    feedback: satisfactionData || [],
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
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
  category: string;
  jobs: number;
  applications: number;
  averageBudget: number;
}> {
  const categoryMap = new Map();

  data.forEach(item => {
    const category = item.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
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
    category: category.category,
    jobs: category.jobs,
    applications: category.applications,
    averageBudget: category.jobs > 0 ? category.totalBudget / category.jobs : 0,
  }));
}

function generatePDFReport(data: any, type: string, period: string) {
  // This would typically use a PDF generation library like Puppeteer or jsPDF
  // For now, return a placeholder response
  return NextResponse.json({
    success: true,
    message: 'PDF report generation not implemented yet',
    data,
    type,
    period,
  });
}

function generateExcelReport(data: any, type: string, period: string) {
  // This would typically use an Excel generation library like xlsx
  // For now, return a placeholder response
  return NextResponse.json({
    success: true,
    message: 'Excel report generation not implemented yet',
    data,
    type,
    period,
  });
}

function generateCSVReport(data: any, type: string, period: string) {
  // This would generate CSV data
  // For now, return a placeholder response
  return NextResponse.json({
    success: true,
    message: 'CSV report generation not implemented yet',
    data,
    type,
    period,
  });
}
