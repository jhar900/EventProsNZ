import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

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
    const type = searchParams.get('type') || 'health';

    if (type === 'health') {
      return await getSystemHealth(supabase);
    } else if (type === 'performance') {
      return await getSystemPerformance(supabase, searchParams);
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Get system info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSystemHealth(supabase: any) {
  try {
    const startTime = Date.now();

    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const dbResponseTime = Date.now() - startTime;
    const dbStatus = dbError ? 'error' : 'healthy';

    // Get system alerts
    const { data: alerts } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent error logs
    const { data: errorLogs } = await supabase
      .from('error_logs')
      .select('*')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate system metrics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalContractors },
      { count: pendingVerifications },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte(
          'last_login',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'contractor'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'contractor')
        .eq('is_verified', false),
    ]);

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        error: dbError?.message,
      },
      metrics: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalContractors: totalContractors || 0,
        pendingVerifications: pendingVerifications || 0,
      },
      alerts: alerts || [],
      recentErrors: errorLogs || [],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ health });
  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    );
  }
}

async function getSystemPerformance(
  supabase: any,
  searchParams: URLSearchParams
) {
  try {
    const period = searchParams.get('period') || '24h';
    const startDate = getStartDate(period);

    // Get performance metrics
    const { data: performanceLogs } = await supabase
      .from('performance_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Calculate average response times
    const avgResponseTime = performanceLogs?.length
      ? performanceLogs.reduce(
          (sum: number, log: any) => sum + (log.response_time || 0),
          0
        ) / performanceLogs.length
      : 0;

    // Get API endpoint performance
    const endpointPerformance =
      performanceLogs?.reduce((acc: any, log: any) => {
        if (!acc[log.endpoint]) {
          acc[log.endpoint] = { count: 0, totalTime: 0, errors: 0 };
        }
        acc[log.endpoint].count++;
        acc[log.endpoint].totalTime += log.response_time || 0;
        if (log.status_code >= 400) {
          acc[log.endpoint].errors++;
        }
        return acc;
      }, {}) || {};

    // Calculate error rates
    const totalRequests = performanceLogs?.length || 0;
    const totalErrors =
      performanceLogs?.filter((log: any) => log.status_code >= 400).length || 0;
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const performance = {
      period,
      metrics: {
        averageResponseTime: Math.round(avgResponseTime),
        totalRequests,
        totalErrors,
        errorRate: Math.round(errorRate * 100) / 100,
        uptime: calculateUptime(performanceLogs || []),
      },
      endpointPerformance,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ performance });
  } catch (error) {
    console.error('System performance check error:', error);
    return NextResponse.json(
      { error: 'Failed to get system performance' },
      { status: 500 }
    );
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

function calculateUptime(logs: any[]): number {
  if (logs.length === 0) return 100;

  const totalRequests = logs.length;
  const successfulRequests = logs.filter(log => log.status_code < 400).length;

  return Math.round((successfulRequests / totalRequests) * 100 * 100) / 100;
}
