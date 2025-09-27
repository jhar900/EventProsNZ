import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;

    // Get user details with profile and business profile
    const { data: userDetails, error: userDetailsError } = await supabase
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
          profile_photo_url,
          bio,
          preferences
        ),
        business_profiles (
          company_name,
          subscription_tier,
          services,
          website,
          description
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

    const { data: updatedUser, error: updateError } = await supabase
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

    // Log admin action
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

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
