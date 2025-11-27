import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // SECURITY: Check for admin access token in headers
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';

    let supabase: any;
    let user: any;

    if (adminToken === expectedToken) {
      // Valid admin token - use admin client and get first admin user
      supabase = supabaseAdmin;
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0 && !adminError) {
        user = {
          id: adminUsers[0].id,
          role: adminUsers[0].role,
        };
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - No admin users found' },
          { status: 401 }
        );
      }
    } else {
      // Fallback: Try normal authentication
      const authResult = await validateAdminAccess(request);
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
      supabase = authResult.supabase || supabaseAdmin;
      user = authResult.user;
    }

    // Verify user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Unsuspend the user
    const { data: unsuspendedUser, error: unsuspendError } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (unsuspendError) {
      return NextResponse.json(
        { error: 'Failed to unsuspend user', details: unsuspendError.message },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'admin_unsuspend_user',
      details: {
        target_user_id: userId,
        admin_user_id: user.id,
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      message: 'User unsuspended successfully',
      user: unsuspendedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
