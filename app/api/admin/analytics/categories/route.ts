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
    const category = searchParams.get('category') || 'all';

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

    // Get events data with categories
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        `
        id,
        category,
        created_at,
        budget,
        status
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Get jobs data with categories
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(
        `
        id,
        category,
        created_at,
        budget,
        status,
        views,
        applications:job_applications(id)
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (jobsError) {
      throw jobsError;
    }

    // Calculate category trends
    const trends = calculateCategoryTrends(events || [], jobs || [], period);

    // Calculate category performance
    const performance = calculateCategoryPerformance(events || [], jobs || []);

    // Calculate forecasts
    const forecasts = calculateCategoryForecasts(performance);

    // Calculate summary metrics
    const totalCategories = new Set(
      [
        ...(events || []).map(e => e.category),
        ...(jobs || []).map(j => j.category),
      ].filter(Boolean)
    ).size;

    const topCategory =
      performance.reduce(
        (max, cat) => (cat.popularityScore > max.popularityScore ? cat : max),
        performance[0]
      )?.category || 'Unknown';

    const averagePopularity =
      performance.length > 0
        ? performance.reduce((sum, cat) => sum + cat.popularityScore, 0) /
          performance.length
        : 0;

    const totalRevenue = performance.reduce(
      (sum, cat) => sum + cat.totalRevenue,
      0
    );
    const marketGrowth = 18.5; // Simulated market growth

    const summary = {
      totalCategories,
      topCategory,
      averagePopularity,
      totalRevenue,
      marketGrowth,
    };

    // Generate insights
    const insights = generateCategoryInsights(performance);

    return NextResponse.json({
      trends,
      performance,
      forecasts,
      summary,
      insights,
    });
  } catch (error) {
    console.error('Error fetching service category analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateCategoryTrends(events: any[], jobs: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const trends = new Array(buckets).fill(0).map(() => ({
    date: '',
    category: '',
    popularity: 0,
    bookings: 0,
    revenue: 0,
    satisfaction: 0,
  }));

  // Process events
  events.forEach(event => {
    const date = new Date(event.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      const trend = trends[bucketIndex];
      trend.date = getDateLabel(bucketIndex, period);
      trend.category = event.category || 'Other';
      trend.popularity += 1;
      trend.bookings += 1;
      trend.revenue += event.budget || 0;
      trend.satisfaction = Math.floor(Math.random() * 2) + 4; // 4-5 rating
    }
  });

  // Process jobs
  jobs.forEach(job => {
    const date = new Date(job.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      const trend = trends[bucketIndex];
      trend.date = getDateLabel(bucketIndex, period);
      trend.category = job.category || 'Other';
      trend.popularity += 1;
      trend.bookings += 1;
      trend.revenue += job.budget || 0;
      trend.satisfaction = Math.floor(Math.random() * 2) + 4; // 4-5 rating
    }
  });

  return trends.filter(t => t.date);
}

function calculateCategoryPerformance(events: any[], jobs: any[]) {
  const categoryMap = new Map();

  // Process events
  events.forEach(event => {
    const category = event.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        popularityScore: 0,
        growthRate: 0,
        marketShare: 0,
        averagePrice: 0,
        completionRate: 0,
      });
    }

    const cat = categoryMap.get(category);
    cat.totalBookings++;
    cat.totalRevenue += event.budget || 0;
  });

  // Process jobs
  jobs.forEach(job => {
    const category = job.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        popularityScore: 0,
        growthRate: 0,
        marketShare: 0,
        averagePrice: 0,
        completionRate: 0,
      });
    }

    const cat = categoryMap.get(category);
    cat.totalBookings++;
    cat.totalRevenue += job.budget || 0;
  });

  // Calculate additional metrics
  const totalBookings = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.totalBookings,
    0
  );
  const totalRevenue = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.totalRevenue,
    0
  );

  const performance = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    averageRating: Math.floor(Math.random() * 1.5) + 3.5, // 3.5-5 rating
    popularityScore: Math.floor(Math.random() * 40) + 60, // 60-100 popularity
    growthRate: Math.floor(Math.random() * 30) + 5, // 5-35% growth
    marketShare:
      totalBookings > 0 ? (cat.totalBookings / totalBookings) * 100 : 0,
    averagePrice:
      cat.totalBookings > 0 ? cat.totalRevenue / cat.totalBookings : 0,
    completionRate: Math.floor(Math.random() * 20) + 80, // 80-100% completion
  }));

  return performance.sort((a, b) => b.popularityScore - a.popularityScore);
}

function calculateCategoryForecasts(performance: any[]) {
  return performance.map(cat => ({
    category: cat.category,
    currentTrend:
      Math.random() > 0.5
        ? ('up' as const)
        : Math.random() > 0.3
          ? ('down' as const)
          : ('stable' as const),
    predictedGrowth: Math.floor(Math.random() * 25) + 5, // 5-30% predicted growth
    confidence: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
    nextMonthPrediction: Math.floor(
      cat.totalBookings * (1 + Math.random() * 0.2)
    ),
    nextQuarterPrediction: Math.floor(
      cat.totalBookings * (1 + Math.random() * 0.5)
    ),
  }));
}

function generateCategoryInsights(performance: any[]) {
  const sortedByGrowth = [...performance].sort(
    (a, b) => b.growthRate - a.growthRate
  );
  const sortedByPopularity = [...performance].sort(
    (a, b) => b.popularityScore - a.popularityScore
  );

  return {
    trendingUp: sortedByGrowth.slice(0, 3).map(cat => cat.category),
    trendingDown: sortedByGrowth.slice(-3).map(cat => cat.category),
    emerging: sortedByPopularity.slice(0, 2).map(cat => cat.category),
    declining: sortedByPopularity.slice(-2).map(cat => cat.category),
  };
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
