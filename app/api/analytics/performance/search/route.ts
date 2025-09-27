import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const QueryParamsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = QueryParamsSchema.parse({
      period: searchParams.get('period'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
    });

    // Build date filter
    let dateFilter = '';
    const now = new Date();

    if (params.date_from && params.date_to) {
      dateFilter = `AND recorded_at >= '${params.date_from}' AND recorded_at <= '${params.date_to}'`;
    } else {
      const periodMap = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
      };
      const daysBack = periodMap[params.period];
      const startDate = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000
      );
      dateFilter = `AND recorded_at >= '${startDate.toISOString()}'`;
    }

    // Get performance metrics
    const { data: performanceMetrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('metric_type', 'search')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (metricsError) {
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      );
    }

    // Get performance alerts
    const { data: alerts, error: alertsError } = await supabase.rpc(
      'get_performance_alerts',
      {
        date_filter: dateFilter,
      }
    );

    if (alertsError) {
      return NextResponse.json(
        { error: 'Failed to fetch performance alerts' },
        { status: 500 }
      );
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      avg_response_time: 0,
      max_response_time: 0,
      min_response_time: 0,
      total_queries: 0,
      error_rate: 0,
      throughput: 0,
    };

    if (performanceMetrics && performanceMetrics.length > 0) {
      const responseTimeMetrics = performanceMetrics.filter(
        m => m.metric_name === 'response_time'
      );
      const errorMetrics = performanceMetrics.filter(
        m => m.metric_name === 'error_count'
      );
      const queryMetrics = performanceMetrics.filter(
        m => m.metric_name === 'query_count'
      );

      if (responseTimeMetrics.length > 0) {
        const values = responseTimeMetrics.map(m => m.metric_value);
        aggregatedMetrics.avg_response_time =
          values.reduce((a, b) => a + b, 0) / values.length;
        aggregatedMetrics.max_response_time = Math.max(...values);
        aggregatedMetrics.min_response_time = Math.min(...values);
      }

      if (queryMetrics.length > 0) {
        aggregatedMetrics.total_queries = queryMetrics.reduce(
          (sum, m) => sum + m.metric_value,
          0
        );
      }

      if (errorMetrics.length > 0 && queryMetrics.length > 0) {
        const totalErrors = errorMetrics.reduce(
          (sum, m) => sum + m.metric_value,
          0
        );
        aggregatedMetrics.error_rate =
          (totalErrors / aggregatedMetrics.total_queries) * 100;
      }
    }

    return NextResponse.json({
      performance_metrics: aggregatedMetrics,
      alerts: alerts || [],
      raw_metrics: performanceMetrics || [],
      period: params.period,
      date_from: params.date_from,
      date_to: params.date_to,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
