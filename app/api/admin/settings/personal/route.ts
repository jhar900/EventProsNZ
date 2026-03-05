import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get user email from headers (sent by frontend)
    const userEmail = request.headers.get('x-user-email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 400 }
      );
    }

    // Fetch user's profile data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(
        `
        id,
        email,
        profiles (
          first_name,
          last_name,
          phone,
          address,
          location,
          bio
        )
      `
      )
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract profile data or use defaults
    const profile = userData.profiles?.[0] || {};
    const settings = {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      location: profile.location || '',
      bio: profile.bio || '',
    };

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get user email from headers
    const userEmail = request.headers.get('x-user-email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 400 }
      );
    }

    const settings = await request.json();

    // First, get the user ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or insert profile data
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userData.id,
        first_name: settings.first_name,
        last_name: settings.last_name,
        phone: settings.phone,
        address: settings.address,
        location: settings.location,
        bio: settings.bio,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings,
      message: 'Personal settings updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
