import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Check for admin access token in headers
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';

    let supabase: any;
    let user: any;

    if (adminToken === expectedToken) {
      // Valid admin token - use admin client and get first admin user
      supabase = supabaseAdmin;
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0 && !adminError) {
        user = {
          id: adminUsers[0].id,
          role: adminUsers[0].role,
        };
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - No admin users found' },
          { status: 401 }
        );
      }
    } else {
      // Fallback: Try normal authentication
      const authResult = await validateAdminAccess(request);
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
      supabase = authResult.supabase || supabaseAdmin;
      user = authResult.user;
    }

    // Verify user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS for fetching all users
    const adminSupabase = supabaseAdmin;

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
    // Fetch all users to get accurate counts by role
    // Use admin client to bypass RLS and get all users
    const { data: allUsers, error: allUsersError } = await adminSupabase
      .from('users')
      .select('id, role, created_at, is_verified');

    if (allUsersError) {
      console.error('Error fetching users:', allUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: allUsersError.message },
        { status: 500 }
      );
    }

    // Ensure allUsers is an array
    const usersArray = Array.isArray(allUsers) ? allUsers : [];

    console.log(`Fetched ${usersArray.length} users from database`);

    // Calculate counts from the fetched data
    const totalUsersCount = usersArray.length;
    const newUsersCount = usersArray.filter(
      (user: any) => new Date(user.created_at) >= startDate
    ).length;
    const totalContractorsCount = usersArray.filter(
      (user: any) => user.role === 'contractor'
    ).length;
    const verifiedContractorsCount = usersArray.filter(
      (user: any) => user.role === 'contractor' && user.is_verified === true
    ).length;
    const totalEventManagersCount = usersArray.filter(
      (user: any) => user.role === 'event_manager'
    ).length;

    // Debug logging to verify counts
    console.log('Calculated user counts:', {
      totalUsers: totalUsersCount,
      newUsers: newUsersCount,
      contractors: totalContractorsCount,
      verifiedContractors: verifiedContractorsCount,
      eventManagers: totalEventManagersCount,
      sampleRoles: usersArray.slice(0, 5).map((u: any) => ({
        id: u.id,
        role: u.role,
        is_verified: u.is_verified,
      })),
    });

    // Get user activity trends
    const { data: userActivity } = await adminSupabase
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
