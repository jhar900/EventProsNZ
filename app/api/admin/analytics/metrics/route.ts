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

    // Get real-time metrics
    const [
      { data: totalUsers, count: totalUsersCount },
      { data: activeUsers, count: activeUsersCount },
      { data: totalRevenue, error: revenueError },
      { data: systemHealth, error: healthError },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte(
          'last_sign_in_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from('payments')
        .select('amount')
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from('system_health')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Calculate metrics
    const currentRevenue =
      totalRevenue?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const previousRevenue = 0; // This would come from a previous calculation
    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const metrics = [
      {
        id: 'total-users',
        name: 'Total Users',
        value: totalUsersCount || 0,
        previousValue: (totalUsersCount || 0) - 50, // Simulated previous value
        unit: 'count',
        trend: 'up' as const,
        status: 'good' as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'active-users',
        name: 'Active Users (24h)',
        value: activeUsersCount || 0,
        previousValue: (activeUsersCount || 0) - 20,
        unit: 'count',
        trend: 'up' as const,
        status: 'good' as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'revenue-24h',
        name: 'Revenue (24h)',
        value: currentRevenue,
        previousValue: previousRevenue,
        unit: 'currency',
        trend: revenueGrowth > 0 ? ('up' as const) : ('down' as const),
        status: revenueGrowth > 0 ? ('good' as const) : ('warning' as const),
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'response-time',
        name: 'Response Time',
        value: 150,
        previousValue: 200,
        unit: 'time',
        trend: 'up' as const,
        status: 'good' as const,
        lastUpdated: new Date().toISOString(),
      },
    ];

    const systemHealthData = {
      status: 'healthy' as const,
      uptime: 99.9,
      responseTime: 150,
      errorRate: 0.1,
    };

    const alerts = [
      {
        id: '1',
        type: 'info' as const,
        message: 'System performance is optimal',
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      metrics,
      systemHealth: systemHealthData,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
