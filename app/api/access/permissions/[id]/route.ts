import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('roles(permissions)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const hasAdminPermission =
      userRole?.roles?.permissions?.includes('admin:write') ||
      userRole?.roles?.permissions?.includes('*');

    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, resource, action, description } = body;

    const { data, error } = await supabase
      .from('permissions')
      .update({
        name,
        resource,
        action,
        description: description || '',
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update permission: ${error.message}`);
    }

    return NextResponse.json({ permission: data });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('roles(permissions)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const hasAdminPermission =
      userRole?.roles?.permissions?.includes('admin:write') ||
      userRole?.roles?.permissions?.includes('*');

    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(`Failed to delete permission: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}
