import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check for admin access token
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';

    if (adminToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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

    // Fetch user's business profile data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(
        `
        id,
        email,
        business_profiles (
          company_name,
          website,
          description,
          subscription_tier,
          industry,
          company_size,
          founded_year
        )
      `
      )
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract business profile data or use defaults
    const businessProfile = userData.business_profiles?.[0] || {};
    const settings = {
      company_name: businessProfile.company_name || '',
      website: businessProfile.website || '',
      description: businessProfile.description || '',
      subscription_tier: businessProfile.subscription_tier || 'free',
      industry: businessProfile.industry || '',
      company_size: businessProfile.company_size || '',
      founded_year: businessProfile.founded_year || undefined,
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
    // Check for admin access token
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';

    if (adminToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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

    // Update or insert business profile data
    const { data: businessProfileData, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .upsert({
          user_id: userData.id,
          company_name: settings.company_name,
          website: settings.website,
          description: settings.description,
          subscription_tier: settings.subscription_tier,
          industry: settings.industry,
          company_size: settings.company_size,
          founded_year: settings.founded_year,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (businessProfileError) {
      return NextResponse.json(
        { error: 'Failed to update business profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings,
      message: 'Business settings updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
