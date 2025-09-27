import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const QueryParamsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  user_segment: z
    .enum(['all', 'new', 'returning', 'premium'])
    .optional()
    .default('all'),
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
      user_segment: searchParams.get('user_segment'),
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
    dateFilter = `AND created_at >= '${startDate.toISOString()}'`;

    // Get behavior metrics
    const { data: behaviorMetrics, error: behaviorError } = await supabase.rpc(
      'get_behavior_metrics',
      {
        date_filter: dateFilter,
        user_segment_filter: params.user_segment,
      }
    );

    if (behaviorError) {
      return NextResponse.json(
        { error: 'Failed to fetch behavior metrics' },
        { status: 500 }
      );
    }

    // Get user journeys
    const { data: userJourneys, error: journeysError } = await supabase.rpc(
      'get_user_journeys',
      {
        date_filter: dateFilter,
        user_segment_filter: params.user_segment,
      }
    );

    if (journeysError) {
      return NextResponse.json(
        { error: 'Failed to fetch user journeys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      behavior_metrics: behaviorMetrics || {},
      user_journeys: userJourneys || [],
      period: params.period,
      user_segment: params.user_segment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
