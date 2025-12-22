import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const unapproveSchema = z.object({
  reason: z.string().optional(),
});

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

    // Always use admin client to bypass RLS for data queries
    // The validateAdminAccess only checks authorization, but we need admin client for queries
    const adminSupabase = supabaseAdmin;
    const adminUser = authResult.user;

    const userId = params.userId;
    const body = await request.json();
    const { reason } = unapproveSchema.parse(body);

    // Update user verification status to false (pending)
    const { error: updateError } = await adminSupabase
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to unapprove user' },
        { status: 400 }
      );
    }

    // Update business profile verification if exists
    const { error: businessUpdateError } = await adminSupabase
      .from('business_profiles')
      .update({
        is_verified: false,
        verification_date: null,
      })
      .eq('user_id', userId);

    if (businessUpdateError) {
      // Log but don't fail
    }

    // Log verification action
    // Only include admin_id if it's a valid UUID (not a dev user string)
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        adminUser.id
      );
    const logData: any = {
      user_id: userId,
      action: 'resubmit',
      status: 'pending',
      reason: reason || 'User unapproved and moved back to pending',
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
      // Log but don't fail
    }

    return NextResponse.json({
      success: true,
      verification_log: verificationLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
