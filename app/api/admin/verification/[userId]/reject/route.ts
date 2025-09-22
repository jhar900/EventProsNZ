import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  feedback: z.string().optional(),
});

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
    const body = await request.json();
    const { reason, feedback } = rejectSchema.parse(body);

    // Update user verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject user' },
        { status: 400 }
      );
    }

    // Update business profile verification if exists
    const { error: businessUpdateError } = await supabase
      .from('business_profiles')
      .update({
        is_verified: false,
        verification_date: null,
      })
      .eq('user_id', userId);

    if (businessUpdateError) {
      console.error(
        'Error updating business profile verification:',
        businessUpdateError
      );
    }

    // Log verification action
    const { data: verificationLog, error: logError } = await supabase
      .from('verification_logs')
      .insert({
        user_id: userId,
        action: 'reject',
        status: 'rejected',
        reason: reason,
        admin_id: user.id,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging verification action:', logError);
    }

    // TODO: Send rejection email to user with feedback

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
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
