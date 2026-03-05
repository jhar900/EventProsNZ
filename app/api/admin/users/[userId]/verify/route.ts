import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const { supabase, user: adminUser } = authResult;

    const { userId } = params;

    const { data: verifiedUser, error: verifyError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (verifyError) {
      return NextResponse.json(
        { error: 'Failed to verify user', details: verifyError.message },
        { status: 500 }
      );
    }

    await supabase.from('activity_logs').insert({
      user_id: adminUser.id,
      action: 'admin_verify_user',
      details: {
        target_user_id: userId,
        admin_user_id: adminUser.id,
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      message: 'User verified successfully',
      user: verifiedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
