import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('api_access_tokens')
      .select(
        `
        *,
        users:user_id(email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: tokens, error } = await query;

    if (error) {
      console.error('Error fetching API tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API tokens' },
        { status: 500 }
      );
    }

    // Transform the data to include user email
    const transformedTokens =
      tokens?.map(token => ({
        ...token,
        user_email: token.users?.email,
      })) || [];

    return NextResponse.json({
      tokens: transformedTokens,
      count: transformedTokens.length,
    });
  } catch (error) {
    console.error('Error in API tokens GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { name, permissions, rate_limit, expires_at } = body;

    // Validate required fields
    if (
      !name ||
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: name, permissions' },
        { status: 400 }
      );
    }

    // Validate rate limit
    if (rate_limit && (rate_limit < 1 || rate_limit > 10000)) {
      return NextResponse.json(
        { error: 'Rate limit must be between 1 and 10000 requests per hour' },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (expires_at && new Date(expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // Generate API token
    const token = `ep_${randomBytes(32).toString('hex')}`;

    // Create the API token
    const { data: apiToken, error } = await supabase
      .from('api_access_tokens')
      .insert({
        name,
        token,
        permissions,
        rate_limit: rate_limit || 1000,
        expires_at: expires_at || null,
        is_active: true,
        user_id: authResult.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API token:', error);
      return NextResponse.json(
        { error: 'Failed to create API token' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'create_api_token',
      resource: 'api_access_tokens',
      resource_id: apiToken.id,
      details: {
        name,
        permissions,
        rate_limit: rate_limit || 1000,
        expires_at,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      token: apiToken,
      message: 'API token created successfully',
    });
  } catch (error) {
    console.error('Error in API tokens POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
