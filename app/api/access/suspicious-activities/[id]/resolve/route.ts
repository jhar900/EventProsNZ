import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { status, resolution_notes } = body;

    // Validate status
    if (!['resolved', 'false_positive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be resolved or false_positive' },
        { status: 400 }
      );
    }

    // Get current activity for logging
    const { data: currentActivity } = await supabase
      .from('suspicious_activities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentActivity) {
      return NextResponse.json(
        { error: 'Suspicious activity not found' },
        { status: 404 }
      );
    }

    if (currentActivity.status !== 'open') {
      return NextResponse.json(
        { error: 'Activity is already resolved' },
        { status: 400 }
      );
    }

    // Update the activity
    const { data: activity, error } = await supabase
      .from('suspicious_activities')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: authResult.userId,
        details: {
          ...currentActivity.details,
          resolution_notes,
          resolved_by: authResult.userId,
          resolved_at: new Date().toISOString(),
        },
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error resolving suspicious activity:', error);
      return NextResponse.json(
        { error: 'Failed to resolve suspicious activity' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'resolve_suspicious_activity',
      resource: 'suspicious_activities',
      resource_id: params.id,
      details: {
        previous_status: currentActivity.status,
        new_status: status,
        resolution_notes,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      activity,
      message: 'Suspicious activity resolved successfully',
    });
  } catch (error) {
    console.error('Error in suspicious activity resolve POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
