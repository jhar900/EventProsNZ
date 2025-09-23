import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

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
    const status = searchParams.get('status') || 'pending';
    const contentType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for content moderation queue
    let query = supabase
      .from('content_reports')
      .select(
        `
        id,
        content_type,
        content_id,
        reported_by,
        reason,
        description,
        status,
        created_at,
        updated_at,
        users!content_reports_reported_by_fkey(
          id,
          email,
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
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: reports, error: reportsError, count } = await query;

    if (reportsError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch content reports',
          details: reportsError.message,
        },
        { status: 500 }
      );
    }

    // Get content moderation summary
    const { data: summary } = await supabase
      .from('content_reports')
      .select('status, content_type')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const summaryStats =
      summary?.reduce((acc: any, report: any) => {
        if (!acc[report.status]) {
          acc[report.status] = {};
        }
        if (!acc[report.status][report.content_type]) {
          acc[report.status][report.content_type] = 0;
        }
        acc[report.status][report.content_type]++;
        return acc;
      }, {}) || {};

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
      summary: summaryStats,
    });
  } catch (error) {
    console.error('Get content reports error:', error);
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
    const { action, reportId, reason, contentId, contentType } = body;

    if (!action || !reportId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, reportId' },
        { status: 400 }
      );
    }

    // Update report status
    const { error: updateError } = await supabase
      .from('content_reports')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_reason: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update report', details: updateError.message },
        { status: 500 }
      );
    }

    // If content should be removed, handle content removal
    if (action === 'remove' && contentId && contentType) {
      await removeContent(supabase, contentType, contentId, user.id, reason);
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: `content_${action}`,
      target_content_id: contentId,
      details: {
        report_id: reportId,
        reason,
        content_type: contentType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content moderation action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function removeContent(
  supabase: any,
  contentType: string,
  contentId: string,
  adminId: string,
  reason: string
) {
  try {
    switch (contentType) {
      case 'profile':
        await supabase
          .from('profiles')
          .update({
            is_removed: true,
            removed_reason: reason,
            removed_by: adminId,
          })
          .eq('user_id', contentId);
        break;
      case 'business_profile':
        await supabase
          .from('business_profiles')
          .update({
            is_removed: true,
            removed_reason: reason,
            removed_by: adminId,
          })
          .eq('user_id', contentId);
        break;
      case 'portfolio':
        await supabase
          .from('portfolio_items')
          .update({
            is_removed: true,
            removed_reason: reason,
            removed_by: adminId,
          })
          .eq('id', contentId);
        break;
      default:
        console.warn(`Unknown content type for removal: ${contentType}`);
    }
  } catch (error) {
    console.error('Error removing content:', error);
    throw error;
  }
}
