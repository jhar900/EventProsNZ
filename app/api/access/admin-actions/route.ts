import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');
    const actionType = searchParams.get('action_type');
    const resource = searchParams.get('resource');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('admin_actions')
      .select(
        `
        *,
        users:admin_id(email)
      `
      )
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (resource) {
      query = query.eq('resource', resource);
    }

    if (search) {
      query = query.or(
        `action_type.ilike.%${search}%,resource.ilike.%${search}%,details::text.ilike.%${search}%`
      );
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching admin actions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admin actions' },
        { status: 500 }
      );
    }

    // Transform the data to include admin email
    const transformedActions =
      actions?.map(action => ({
        ...action,
        admin_email: action.users?.email,
      })) || [];

    return NextResponse.json({
      actions: transformedActions,
      count: transformedActions.length,
    });
  } catch (error) {
    console.error('Error in admin actions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
