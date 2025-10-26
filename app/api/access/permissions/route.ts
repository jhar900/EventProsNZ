import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AccessControlService } from '@/lib/security/access-control-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessControlService = new AccessControlService();
    const permissions = await accessControlService.getPermissions();

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const accessControlService = new AccessControlService();
    const hasPermission = await accessControlService.checkPermission(
      user.id,
      'admin:write'
    );

    if (!hasPermission.hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, resource, action, description } = body;

    if (!name || !resource || !action) {
      return NextResponse.json(
        { error: 'Name, resource, and action are required' },
        { status: 400 }
      );
    }

    // Create permission in database
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        id: crypto.randomUUID(),
        name,
        resource,
        action,
        description: description || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }

    return NextResponse.json({ permission: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
