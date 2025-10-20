import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '@/lib/documents/permission-service';

const permissionService = new PermissionService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const permissions = await permissionService.getDocumentPermissions(id);

    return NextResponse.json({
      permissions,
      success: true,
    });
  } catch (error) {
    console.error('GET /api/documents/[id]/permissions error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch permissions',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user_id, access_type, expires_at } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!user_id || !access_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, access_type' },
        { status: 400 }
      );
    }

    const permission = await permissionService.grantPermission(
      id,
      user_id,
      access_type,
      expires_at
    );

    return NextResponse.json({
      permission,
      success: true,
    });
  } catch (error) {
    console.error('POST /api/documents/[id]/permissions error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to grant permission',
      },
      { status: 500 }
    );
  }
}
