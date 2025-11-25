import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // SECURITY: Check for admin access token in headers (same as users list endpoint)
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';

    let supabase: any;
    let adminUser: any;

    if (adminToken === expectedToken) {
      // Valid admin token - use admin client
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_verified, last_login')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0 && !adminError) {
        supabase = supabaseAdmin;
        adminUser = {
          id: adminUsers[0].id,
          role: adminUsers[0].role,
        };
      } else {
        return NextResponse.json(
          { error: 'No admin users found' },
          { status: 403 }
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
      adminUser = authResult.user;
    }

    const { userId } = params;

    // Unverify the user
    const { data: unverifiedUser, error: unverifyError } = await supabase
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (unverifyError) {
      return NextResponse.json(
        { error: 'Failed to unverify user', details: unverifyError.message },
        { status: 500 }
      );
    }

    // Also update business profile verification if exists
    await supabase
      .from('business_profiles')
      .update({
        is_verified: false,
        verification_date: null,
      })
      .eq('user_id', userId);

    // Log admin action
    await supabase.from('activity_logs').insert({
      user_id: adminUser.id,
      action: 'admin_unverify_user',
      details: {
        target_user_id: userId,
        admin_user_id: adminUser.id,
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      message: 'User unverified successfully',
      user: unverifiedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
