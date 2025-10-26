import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('suspicious_activities')
      .select(
        `
        *,
        users:user_id(email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching suspicious activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suspicious activities' },
        { status: 500 }
      );
    }

    // Transform the data to include user email
    const transformedActivities =
      activities?.map(activity => ({
        ...activity,
        user_email: activity.users?.email,
      })) || [];

    return NextResponse.json({
      activities: transformedActivities,
      count: transformedActivities.length,
    });
  } catch (error) {
    console.error('Error in suspicious activities GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { user_id, activity_type, severity, details } = body;

    // Validate required fields
    if (!user_id || !activity_type || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, activity_type, severity' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be low, medium, high, or critical' },
        { status: 400 }
      );
    }

    // Create the suspicious activity
    const { data: activity, error } = await supabase
      .from('suspicious_activities')
      .insert({
        user_id,
        activity_type,
        severity,
        details: details || {},
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating suspicious activity:', error);
      return NextResponse.json(
        { error: 'Failed to create suspicious activity' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'create_suspicious_activity',
      resource: 'suspicious_activities',
      resource_id: activity.id,
      details: {
        user_id,
        activity_type,
        severity,
        details,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      activity,
      message: 'Suspicious activity created successfully',
    });
  } catch (error) {
    console.error('Error in suspicious activities POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
