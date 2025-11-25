import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = authResult.supabase || supabaseAdmin;
    const adminUser = authResult.user;

    const userId = params.userId;

    // Log resubmission action
    // Only include admin_id if it's a valid UUID (not a dev user string)
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        adminUser.id
      );
    const logData: any = {
      user_id: userId,
      action: 'resubmit',
      status: 'pending',
      reason: 'User resubmitted for verification',
    };
    if (isValidUUID) {
      logData.admin_id = adminUser.id;
    }

    const { data: verificationLog, error: logError } = await adminSupabase
      .from('verification_logs')
      .insert(logData)
      .select()
      .single();

    if (logError) {
    }

    return NextResponse.json({
      success: true,
      verification_log: verificationLog,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
