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
    const severity = searchParams.get('severity');
    const isResolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for system alerts
    let query = supabase
      .from('system_alerts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (isResolved !== null && isResolved !== undefined) {
      query = query.eq('is_resolved', isResolved === 'true');
    }

    const { data: alerts, error: alertsError, count } = await query;

    if (alertsError) {
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: alertsError.message },
        { status: 500 }
      );
    }

    // Get alert summary
    const { data: alertSummary } = await supabase
      .from('system_alerts')
      .select('severity, is_resolved')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const summary =
      alertSummary?.reduce((acc: any, alert: any) => {
        const key = `${alert.severity}_${alert.is_resolved ? 'resolved' : 'active'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}) || {};

    return NextResponse.json({
      alerts: alerts || [],
      total: count || 0,
      limit,
      offset,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, alertId, resolution } = body;

    if (!action || !alertId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, alertId' },
        { status: 400 }
      );
    }

    if (action === 'resolve') {
      // Resolve alert
      const { error: updateError } = await supabase
        .from('system_alerts')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution,
        })
        .eq('id', alertId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to resolve alert', details: updateError.message },
          { status: 500 }
        );
      }
    } else if (action === 'dismiss') {
      // Dismiss alert
      const { error: updateError } = await supabase
        .from('system_alerts')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution: 'Dismissed by admin',
        })
        .eq('id', alertId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to dismiss alert', details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: `alert_${action}`,
      target_alert_id: alertId,
      details: {
        resolution,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { alertType, severity, message, details } = body;

    if (!alertType || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: alertType, severity, message' },
        { status: 400 }
      );
    }

    // Create new alert
    const { data: newAlert, error: createError } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: alertType,
        severity,
        message,
        details,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create alert', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert: newAlert });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
