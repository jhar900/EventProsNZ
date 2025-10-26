import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { data: token, error } = await supabase
      .from('api_access_tokens')
      .select(
        `
        *,
        users:user_id(email)
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API token not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching API token:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: {
        ...token,
        user_email: token.users?.email,
      },
    });
  } catch (error) {
    console.error('Error in API token GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { name, permissions, rate_limit, expires_at, is_active } = body;

    // Get current token for logging
    const { data: currentToken } = await supabase
      .from('api_access_tokens')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentToken) {
      return NextResponse.json(
        { error: 'API token not found' },
        { status: 404 }
      );
    }

    // Validate rate limit if provided
    if (rate_limit && (rate_limit < 1 || rate_limit > 10000)) {
      return NextResponse.json(
        { error: 'Rate limit must be between 1 and 10000 requests per hour' },
        { status: 400 }
      );
    }

    // Validate expiration date if provided
    if (expires_at && new Date(expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // Update the token
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (rate_limit !== undefined) updateData.rate_limit = rate_limit;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: token, error } = await supabase
      .from('api_access_tokens')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating API token:', error);
      return NextResponse.json(
        { error: 'Failed to update API token' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'update_api_token',
      resource: 'api_access_tokens',
      resource_id: params.id,
      details: {
        changes: updateData,
        previous: currentToken,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      token,
      message: 'API token updated successfully',
    });
  } catch (error) {
    console.error('Error in API token PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();

    // Get current token for logging
    const { data: currentToken } = await supabase
      .from('api_access_tokens')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentToken) {
      return NextResponse.json(
        { error: 'API token not found' },
        { status: 404 }
      );
    }

    // Delete the token
    const { error } = await supabase
      .from('api_access_tokens')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting API token:', error);
      return NextResponse.json(
        { error: 'Failed to delete API token' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'delete_api_token',
      resource: 'api_access_tokens',
      resource_id: params.id,
      details: {
        deleted_token: currentToken,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: 'API token deleted successfully',
    });
  } catch (error) {
    console.error('Error in API token DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
