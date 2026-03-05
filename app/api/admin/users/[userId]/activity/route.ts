import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { supabase } = authResult;

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user activity logs
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select(
        `
        id,
        action,
        details,
        ip_address,
        user_agent,
        created_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activitiesError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch user activity',
          details: activitiesError.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to get activity count', details: countError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
