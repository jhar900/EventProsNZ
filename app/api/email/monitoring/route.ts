import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailMonitoringDashboard } from '@/lib/email/email-monitoring-dashboard';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration
const monitoringRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many monitoring requests, please try again later',
};

export const GET = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, monitoringRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !userData ||
      (userData.role !== 'admin' && userData.role !== 'editor')
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const dashboard = new EmailMonitoringDashboard();
    const data = await dashboard.getDashboardData();

    const response = NextResponse.json({
      success: true,
      data,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, monitoringRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, alertId, alert } = body;

    const dashboard = new EmailMonitoringDashboard();
    let result;

    switch (action) {
      case 'create-alert':
        await dashboard.createAlert(alert);
        result = { message: 'Alert created successfully' };
        break;
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }
        await dashboard.resolveAlert(alertId);
        result = { message: 'Alert resolved successfully' };
        break;
      case 'stats':
        result = await dashboard.getMonitoringStats();
        break;
      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Must be create-alert, resolve-alert, or stats',
          },
          { status: 400 }
        );
    }

    const response = NextResponse.json({
      success: true,
      result,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Monitoring action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform monitoring action' },
      { status: 500 }
    );
  }
};
