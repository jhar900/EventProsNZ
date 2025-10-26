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
    const { data: permission, error } = await supabase
      .from('file_access_permissions')
      .select(
        `
        *,
        users:user_id(email),
        files:file_id(name)
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'File permission not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching file permission:', error);
      return NextResponse.json(
        { error: 'Failed to fetch file permission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      permission: {
        ...permission,
        user_email: permission.users?.email,
        file_name: permission.files?.name,
      },
    });
  } catch (error) {
    console.error('Error in file permission GET:', error);
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
    const { access_level, expires_at, is_active } = body;

    // Validate access level if provided
    if (access_level && !['read', 'write', 'admin'].includes(access_level)) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be read, write, or admin' },
        { status: 400 }
      );
    }

    // Get current permission for logging
    const { data: currentPermission } = await supabase
      .from('file_access_permissions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentPermission) {
      return NextResponse.json(
        { error: 'File permission not found' },
        { status: 404 }
      );
    }

    // Update the permission
    const updateData: any = {};
    if (access_level !== undefined) updateData.access_level = access_level;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: permission, error } = await supabase
      .from('file_access_permissions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating file permission:', error);
      return NextResponse.json(
        { error: 'Failed to update file permission' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'update_file_permission',
      resource: 'file_access_permissions',
      resource_id: params.id,
      details: {
        changes: updateData,
        previous: currentPermission,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      permission,
      message: 'File access permission updated successfully',
    });
  } catch (error) {
    console.error('Error in file permission PUT:', error);
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

    // Get current permission for logging
    const { data: currentPermission } = await supabase
      .from('file_access_permissions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentPermission) {
      return NextResponse.json(
        { error: 'File permission not found' },
        { status: 404 }
      );
    }

    // Delete the permission
    const { error } = await supabase
      .from('file_access_permissions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting file permission:', error);
      return NextResponse.json(
        { error: 'Failed to delete file permission' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'delete_file_permission',
      resource: 'file_access_permissions',
      resource_id: params.id,
      details: {
        deleted_permission: currentPermission,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: 'File access permission deleted successfully',
    });
  } catch (error) {
    console.error('Error in file permission DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
