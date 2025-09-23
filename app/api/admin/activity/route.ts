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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const activityType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build base query for user activity
    let query = supabase
      .from('user_activity_logs')
      .select(
        `
        id,
        user_id,
        activity_type,
        activity_data,
        ip_address,
        user_agent,
        created_at,
        users!inner(
          id,
          email,
          role,
          profiles!inner(
            first_name,
            last_name
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: activities, error: activitiesError, count } = await query;

    if (activitiesError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch user activity',
          details: activitiesError.message,
        },
        { status: 500 }
      );
    }

    // Get activity summary
    const { data: activitySummary } = await supabase
      .from('user_activity_logs')
      .select('activity_type')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const summary =
      activitySummary?.reduce((acc: any, activity: any) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {}) || {};

    // Get suspicious activity indicators
    const suspiciousActivities = await detectSuspiciousActivity(
      supabase,
      activities || []
    );

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      limit,
      offset,
      summary,
      suspiciousActivities,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function detectSuspiciousActivity(supabase: any, activities: any[]) {
  const suspicious = [];

  // Check for rapid login attempts
  const loginActivities = activities.filter(a => a.activity_type === 'login');
  const loginByIP = loginActivities.reduce((acc: any, activity: any) => {
    if (!acc[activity.ip_address]) {
      acc[activity.ip_address] = [];
    }
    acc[activity.ip_address].push(activity);
    return acc;
  }, {});

  for (const [ip, logins] of Object.entries(loginByIP)) {
    if ((logins as any[]).length > 10) {
      suspicious.push({
        type: 'rapid_logins',
        severity: 'high',
        message: `Multiple login attempts from IP: ${ip}`,
        count: (logins as any[]).length,
        ip,
      });
    }
  }

  // Check for unusual activity patterns
  const userActivityCounts = activities.reduce((acc: any, activity: any) => {
    acc[activity.user_id] = (acc[activity.user_id] || 0) + 1;
    return acc;
  }, {});

  for (const [userId, count] of Object.entries(userActivityCounts)) {
    if ((count as number) > 100) {
      suspicious.push({
        type: 'high_activity',
        severity: 'medium',
        message: `Unusually high activity for user: ${userId}`,
        count,
        userId,
      });
    }
  }

  return suspicious;
}
