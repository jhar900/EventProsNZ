import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.userId;

    // Log resubmission action
    const { data: verificationLog, error: logError } = await supabase
      .from('verification_logs')
      .insert({
        user_id: userId,
        action: 'resubmit',
        status: 'pending',
        reason: 'User resubmitted for verification',
        admin_id: user.id,
      })
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
