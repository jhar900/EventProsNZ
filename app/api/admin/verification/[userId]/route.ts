import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.userId;

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        is_verified,
        created_at,
        updated_at,
        last_login,
        profiles!inner(
          first_name,
          last_name,
          phone,
          address,
          bio,
          profile_photo_url
        ),
        business_profiles(
          company_name,
          business_address,
          nzbn,
          description,
          service_areas,
          social_links,
          is_verified,
          verification_date
        )
      `
      )
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get verification log
    const { data: verificationLog, error: logError } = await supabase
      .from('verification_logs')
      .select(
        `
        id,
        action,
        status,
        reason,
        created_at,
        admin_id,
        profiles!verification_logs_admin_id_fkey(
          first_name,
          last_name
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (logError) {
      }

    return NextResponse.json({
      user: userData,
      verification_log: verificationLog || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
