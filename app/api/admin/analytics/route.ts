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
    const period = searchParams.get('period') || '7d';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
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
        startDate = dateFrom
          ? new Date(dateFrom)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const endDate = dateTo ? new Date(dateTo) : now;

    // Get platform metrics
    const [
      { data: totalUsers, count: totalUsersCount },
      { data: newUsers, count: newUsersCount },
      { data: totalContractors, count: totalContractorsCount },
      { data: verifiedContractors, count: verifiedContractorsCount },
      { data: totalEventManagers, count: totalEventManagersCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'contractor'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'contractor')
        .eq('is_verified', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'event_manager'),
    ]);

    // Get user activity trends
    const { data: userActivity } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Calculate trends
    const userTrends = calculateTrends(userActivity || [], period);

    const metrics = {
      totalUsers: totalUsersCount || 0,
      newUsers: newUsersCount || 0,
      totalContractors: totalContractorsCount || 0,
      verifiedContractors: verifiedContractorsCount || 0,
      totalEventManagers: totalEventManagersCount || 0,
      verificationRate: totalContractorsCount
        ? Math.round(
            ((verifiedContractorsCount || 0) / totalContractorsCount) * 100
          )
        : 0,
    };

    const trends = {
      userGrowth: userTrends,
      verificationTrend: calculateVerificationTrend(
        verifiedContractorsCount || 0,
        totalContractorsCount || 0
      ),
    };

    return NextResponse.json({
      metrics,
      trends,
      period,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTrends(activity: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const trend = new Array(buckets).fill(0);

  activity.forEach(item => {
    const date = new Date(item.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      trend[bucketIndex]++;
    }
  });

  return trend;
}

function calculateVerificationTrend(verified: number, total: number) {
  if (total === 0) return 0;
  return Math.round((verified / total) * 100);
}

function getTimeBuckets(period: string): number {
  switch (period) {
    case '24h':
      return 24; // hourly
    case '7d':
      return 7; // daily
    case '30d':
      return 30; // daily
    case '90d':
      return 12; // weekly
    default:
      return 7;
  }
}

function getBucketIndex(date: Date, period: string, buckets: number): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  switch (period) {
    case '24h':
      return Math.floor(diff / (60 * 60 * 1000));
    case '7d':
    case '30d':
      return Math.floor(diff / (24 * 60 * 60 * 1000));
    case '90d':
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    default:
      return Math.floor(diff / (24 * 60 * 60 * 1000));
  }
}
