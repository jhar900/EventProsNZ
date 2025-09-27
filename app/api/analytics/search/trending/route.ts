import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const QueryParamsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
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
      limit: searchParams.get('limit'),
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
    dateFilter = `AND date >= '${startDate.toISOString()}'`;

    // Get trending search terms
    const { data: trendingTerms, error: termsError } = await supabase
      .from('trending_search_terms')
      .select('*')
      .order('date', { ascending: false })
      .order('search_count', { ascending: false })
      .limit(params.limit);

    if (termsError) {
      return NextResponse.json(
        { error: 'Failed to fetch trending terms' },
        { status: 500 }
      );
    }

    // Get trending services
    const { data: trendingServices, error: servicesError } = await supabase.rpc(
      'get_trending_services',
      {
        date_filter: dateFilter,
        limit_count: params.limit,
      }
    );

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch trending services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trending_terms: trendingTerms || [],
      trending_services: trendingServices || [],
      period: params.period,
      limit: params.limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
