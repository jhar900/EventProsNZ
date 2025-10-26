import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('file_access_permissions')
      .select(
        `
        *,
        users:user_id(email),
        files:file_id(name)
      `
      )
      .order('created_at', { ascending: false });

    if (fileId) {
      query = query.eq('file_id', fileId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Error fetching file permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch file permissions' },
        { status: 500 }
      );
    }

    // Transform the data to include user email and file name
    const transformedPermissions =
      permissions?.map(permission => ({
        ...permission,
        user_email: permission.users?.email,
        file_name: permission.files?.name,
      })) || [];

    return NextResponse.json({
      permissions: transformedPermissions,
      count: transformedPermissions.length,
    });
  } catch (error) {
    console.error('Error in file permissions GET:', error);
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
    const { file_id, user_id, access_level, expires_at } = body;

    // Validate required fields
    if (!file_id || !user_id || !access_level) {
      return NextResponse.json(
        { error: 'Missing required fields: file_id, user_id, access_level' },
        { status: 400 }
      );
    }

    // Validate access level
    if (!['read', 'write', 'admin'].includes(access_level)) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be read, write, or admin' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const { data: existingPermission } = await supabase
      .from('file_access_permissions')
      .select('id')
      .eq('file_id', file_id)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission already exists for this user and file' },
        { status: 409 }
      );
    }

    // Create the permission
    const { data: permission, error } = await supabase
      .from('file_access_permissions')
      .insert({
        file_id,
        user_id,
        access_level,
        expires_at: expires_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating file permission:', error);
      return NextResponse.json(
        { error: 'Failed to create file permission' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'create_file_permission',
      resource: 'file_access_permissions',
      resource_id: permission.id,
      details: {
        file_id,
        user_id,
        access_level,
        expires_at,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      permission,
      message: 'File access permission created successfully',
    });
  } catch (error) {
    console.error('Error in file permissions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
