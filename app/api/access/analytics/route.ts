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

    // Check if user has admin permissions
    const accessControlService = new AccessControlService();
    const hasPermission = await accessControlService.checkPermission(
      user.id,
      'admin:read'
    );

    if (!hasPermission.hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const analytics = await accessControlService.getAccessControlAnalytics();

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching access control analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
