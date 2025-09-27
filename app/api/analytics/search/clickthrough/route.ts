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
      dateFilter = `AND click_timestamp >= '${params.date_from}' AND click_timestamp <= '${params.date_to}'`;
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
      dateFilter = `AND click_timestamp >= '${startDate.toISOString()}'`;
    }

    // Get CTR metrics
    const { data: ctrMetrics, error: ctrError } = await supabase.rpc(
      'get_ctr_metrics',
      {
        date_filter: dateFilter,
      }
    );

    if (ctrError) {
      return NextResponse.json(
        { error: 'Failed to fetch CTR metrics' },
        { status: 500 }
      );
    }

    // Get click analytics
    const { data: clickAnalytics, error: clickError } = await supabase
      .from('click_through_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);

    if (clickError) {
      return NextResponse.json(
        { error: 'Failed to fetch click analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ctr_metrics: ctrMetrics || {},
      click_analytics: clickAnalytics || [],
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
