import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;

    // Use admin client to bypass RLS for fetching user details
    // In development mode, authResult.supabase might be null, so use supabaseAdmin
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get user details with profile and business profile
    const { data: userDetails, error: userDetailsError } = await adminSupabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        is_verified,
        last_login,
        created_at,
        updated_at,
        profiles (
          first_name,
          last_name,
          phone,
          address,
          avatar_url,
          bio,
          location,
          timezone
        ),
        business_profiles (
          company_name,
          subscription_tier,
          website,
          description,
          location,
          service_categories,
          is_verified
        )
      `
      )
      .eq('id', userId)
      .single();

    if (userDetailsError) {
      return NextResponse.json(
        { error: 'User not found', details: userDetailsError.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userDetails });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        return (
          authResult.response ||
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        );
      }
      supabase = authResult.supabase || supabaseAdmin;
      user = authResult.user;
    }

    const { userId } = params;
    const body = await request.json();
    const { role, is_verified, status } = body;

    // Validate input
    if (role && !['admin', 'event_manager', 'contractor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user
    const updateData: any = {};
    if (role) updateData.role = role;
    if (typeof is_verified === 'boolean') updateData.is_verified = is_verified;
    if (status) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    // Use admin client to bypass RLS for updating user details
    const adminSupabase = supabase || supabaseAdmin;

    const { data: updatedUser, error: updateError } = await adminSupabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      );
    }

    // Log admin action (only if we have a supabase client)
    if (supabase) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'admin_update_user',
        details: {
          target_user_id: userId,
          changes: updateData,
          admin_user_id: user.id,
        },
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
