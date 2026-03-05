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
    const { supabase, user } = authResult;

    const { userId } = params;

    const { data: unsuspendedUser, error: unsuspendError } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (unsuspendError) {
      return NextResponse.json(
        { error: 'Failed to unsuspend user', details: unsuspendError.message },
        { status: 500 }
      );
    }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'admin_unsuspend_user',
      details: {
        target_user_id: userId,
        admin_user_id: user.id,
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      message: 'User unsuspended successfully',
      user: unsuspendedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
