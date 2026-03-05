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

    const { data: unverifiedUser, error: unverifyError } = await supabase
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (unverifyError) {
      return NextResponse.json(
        { error: 'Failed to unverify user', details: unverifyError.message },
        { status: 500 }
      );
    }

    await supabase
      .from('business_profiles')
      .update({
        is_verified: false,
        verification_date: null,
      })
      .eq('user_id', userId);

    await supabase.from('activity_logs').insert({
      user_id: adminUser.id,
      action: 'admin_unverify_user',
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
      message: 'User unverified successfully',
      user: unverifiedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
