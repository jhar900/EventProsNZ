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
      dateFilter = `AND created_at >= '${params.date_from}' AND created_at <= '${params.date_to}'`;
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
      dateFilter = `AND created_at >= '${startDate.toISOString()}'`;
    }

    // Get filter usage analytics
    const { data: filters, error: filtersError } = await supabase
      .from('filter_usage_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);

    if (filtersError) {
      return NextResponse.json(
        { error: 'Failed to fetch filter analytics' },
        { status: 500 }
      );
    }

    // Get filter usage patterns
    const { data: patterns, error: patternsError } = await supabase.rpc(
      'get_filter_usage_patterns',
      {
        date_filter: dateFilter,
      }
    );

    if (patternsError) {
      return NextResponse.json(
        { error: 'Failed to fetch filter patterns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      filters: filters || [],
      usage_patterns: patterns || [],
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
