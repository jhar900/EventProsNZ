import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const QueryParamsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
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
    });

    // Build date filter
    let dateFilter = '';
    const now = new Date();

    const periodMap = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };
    const daysBack = periodMap[params.period];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    dateFilter = `AND recorded_at >= '${startDate.toISOString()}'`;

    // Get infinite scroll metrics
    const { data: scrollMetrics, error: scrollError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('metric_type', 'infinite_scroll')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (scrollError) {
      return NextResponse.json(
        { error: 'Failed to fetch scroll metrics' },
        { status: 500 }
      );
    }

    // Get optimization recommendations
    const { data: recommendations, error: recommendationsError } =
      await supabase.rpc('get_scroll_optimization_recommendations', {
        date_filter: dateFilter,
      });

    if (recommendationsError) {
      return NextResponse.json(
        { error: 'Failed to fetch optimization recommendations' },
        { status: 500 }
      );
    }

    // Calculate aggregated scroll metrics
    const aggregatedScrollMetrics = {
      avg_load_time: 0,
      avg_scroll_depth: 0,
      avg_items_per_page: 0,
      total_scroll_events: 0,
      bounce_rate: 0,
      performance_score: 0,
    };

    if (scrollMetrics && scrollMetrics.length > 0) {
      const loadTimeMetrics = scrollMetrics.filter(
        m => m.metric_name === 'load_time'
      );
      const scrollDepthMetrics = scrollMetrics.filter(
        m => m.metric_name === 'scroll_depth'
      );
      const itemsPerPageMetrics = scrollMetrics.filter(
        m => m.metric_name === 'items_per_page'
      );
      const scrollEventMetrics = scrollMetrics.filter(
        m => m.metric_name === 'scroll_events'
      );

      if (loadTimeMetrics.length > 0) {
        const values = loadTimeMetrics.map(m => m.metric_value);
        aggregatedScrollMetrics.avg_load_time =
          values.reduce((a, b) => a + b, 0) / values.length;
      }

      if (scrollDepthMetrics.length > 0) {
        const values = scrollDepthMetrics.map(m => m.metric_value);
        aggregatedScrollMetrics.avg_scroll_depth =
          values.reduce((a, b) => a + b, 0) / values.length;
      }

      if (itemsPerPageMetrics.length > 0) {
        const values = itemsPerPageMetrics.map(m => m.metric_value);
        aggregatedScrollMetrics.avg_items_per_page =
          values.reduce((a, b) => a + b, 0) / values.length;
      }

      if (scrollEventMetrics.length > 0) {
        aggregatedScrollMetrics.total_scroll_events = scrollEventMetrics.reduce(
          (sum, m) => sum + m.metric_value,
          0
        );
      }

      // Calculate performance score (0-100)
      const loadTimeScore = Math.max(
        0,
        100 - (aggregatedScrollMetrics.avg_load_time / 1000) * 10
      );
      const scrollDepthScore = Math.min(
        100,
        aggregatedScrollMetrics.avg_scroll_depth * 10
      );
      aggregatedScrollMetrics.performance_score =
        (loadTimeScore + scrollDepthScore) / 2;
    }

    return NextResponse.json({
      scroll_metrics: aggregatedScrollMetrics,
      optimization_recommendations: recommendations || [],
      raw_metrics: scrollMetrics || [],
      period: params.period,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
