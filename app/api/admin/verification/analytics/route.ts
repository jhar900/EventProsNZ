import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = analyticsQuerySchema.parse({
      period: searchParams.get('period'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
    });

    // Calculate date range
    let dateFrom: Date;
    let dateTo = new Date();

    if (query.date_from && query.date_to) {
      dateFrom = new Date(query.date_from);
      dateTo = new Date(query.date_to);
    } else {
      const period = query.period || '30d';
      switch (period) {
        case '7d':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Get verification metrics
    const { data: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('id, is_verified, created_at, role')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    if (totalError) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const total = totalUsers?.length || 0;
    const verified = totalUsers?.filter(u => u.is_verified).length || 0;
    const pending = totalUsers?.filter(u => !u.is_verified).length || 0;
    const contractors =
      totalUsers?.filter(u => u.role === 'contractor').length || 0;
    const eventManagers =
      totalUsers?.filter(u => u.role === 'event_manager').length || 0;

    // Get verification trends (daily counts)
    const { data: trends, error: trendsError } = await supabase
      .from('verification_logs')
      .select('action, created_at')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString())
      .order('created_at', { ascending: true });

    if (trendsError) {
      }

    // Process trends data
    const trendsData =
      trends?.reduce(
        (acc, log) => {
          const date = new Date(log.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { approvals: 0, rejections: 0 };
          }
          if (log.action === 'approve') {
            acc[date].approvals++;
          } else if (log.action === 'reject') {
            acc[date].rejections++;
          }
          return acc;
        },
        {} as Record<string, { approvals: number; rejections: number }>
      ) || {};

    const trendsArray = Object.entries(trendsData).map(([date, data]) => ({
      date,
      approvals: data.approvals,
      rejections: data.rejections,
    }));

    const metrics = {
      total_users: total,
      verified_users: verified,
      pending_users: pending,
      verification_rate: total > 0 ? (verified / total) * 100 : 0,
      contractors: contractors,
      event_managers: eventManagers,
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
    };

    return NextResponse.json({
      metrics,
      trends: trendsArray,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
