import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withRateLimit, analyticsRateLimit } from '@/lib/rate-limiting';

const QueryParamsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

async function handler(request: NextRequest) {
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
      limit: searchParams.get('limit'),
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

    // Get query analytics
    const { data: queries, error: queriesError } = await supabase.rpc(
      'get_search_query_analytics',
      {
        date_filter: dateFilter,
        limit_count: params.limit,
      }
    );

    if (queriesError) {
      console.error('Error fetching query analytics:', queriesError);
      return NextResponse.json(
        { error: 'Failed to fetch query analytics' },
        { status: 500 }
      );
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('search_queries')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching total count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch total count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      queries: queries || [],
      total: totalCount || 0,
      period: params.period,
      date_from: params.date_from,
      date_to: params.date_to,
    });
  } catch (error) {
    console.error('Error in search queries analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the rate-limited handler
export const GET = withRateLimit(analyticsRateLimit)(handler);
