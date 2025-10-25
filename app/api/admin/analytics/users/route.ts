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

    // Get user growth data
    const { data: userGrowth, error: userGrowthError } = await supabase
      .from('users')
      .select('created_at, role')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (userGrowthError) {
      throw userGrowthError;
    }

    // Calculate growth trends
    const growthData = calculateGrowthTrends(userGrowth || [], period);

    // Get cohort data
    const cohorts = calculateCohortData(userGrowth || []);

    // Calculate summary metrics
    const totalSignups = userGrowth?.length || 0;
    const totalActiveUsers = Math.floor(totalSignups * 0.7); // Simulated active users
    const totalChurned = Math.floor(totalSignups * 0.1); // Simulated churn
    const averageRetention = 85.5; // Simulated retention rate
    const churnRate = (totalChurned / totalSignups) * 100;
    const growthRate = 12.5; // Simulated growth rate

    const summary = {
      totalSignups,
      totalActiveUsers,
      totalChurned,
      averageRetention,
      churnRate,
      growthRate,
    };

    const trends = {
      signupTrend: 'up' as const,
      retentionTrend: 'up' as const,
      churnTrend: 'down' as const,
    };

    return NextResponse.json({
      growth: growthData,
      cohorts,
      summary,
      trends,
    });
  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateGrowthTrends(users: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const growth = new Array(buckets).fill(0);
  const activeUsers = new Array(buckets).fill(0);
  const churnedUsers = new Array(buckets).fill(0);
  const retentionRate = new Array(buckets).fill(85);

  users.forEach(user => {
    const date = new Date(user.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      growth[bucketIndex]++;
      // Simulate active users and churn
      activeUsers[bucketIndex] = Math.floor(growth[bucketIndex] * 0.7);
      churnedUsers[bucketIndex] = Math.floor(growth[bucketIndex] * 0.1);
    }
  });

  return growth.map((signups, index) => ({
    date: getDateLabel(index, period),
    signups,
    activeUsers: activeUsers[index],
    churnedUsers: churnedUsers[index],
    retentionRate: retentionRate[index],
  }));
}

function calculateCohortData(users: any[]) {
  const cohorts = [];
  const now = new Date();

  // Create monthly cohorts for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return (
        userDate.getMonth() === cohortDate.getMonth() &&
        userDate.getFullYear() === cohortDate.getFullYear()
      );
    });

    if (cohortUsers.length > 0) {
      const retention = [100, 85, 75, 70, 65, 60]; // Simulated retention rates
      cohorts.push({
        cohort: cohortDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        size: cohortUsers.length,
        retention,
        revenue: cohortUsers.length * 150, // Simulated revenue
      });
    }
  }

  return cohorts;
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
