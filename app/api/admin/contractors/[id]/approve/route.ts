import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contractorId = params.id;
    const body = await request.json();
    const { admin_notes } = body;

    // Update contractor onboarding status
    const { error: updateError } = await supabase
      .from('contractor_onboarding_status')
      .update({
        approval_status: 'approved',
        approval_date: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq('user_id', contractorId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve contractor' },
        { status: 500 }
      );
    }

    // Update business profile verification status
    const { error: businessProfileError } = await supabase
      .from('business_profiles')
      .update({
        is_verified: true,
        verification_date: new Date().toISOString(),
      })
      .eq('user_id', contractorId);

    if (businessProfileError) {
      console.error(
        'Failed to update business profile verification:',
        businessProfileError
      );
      // Don't fail the request, just log the error
    }

    // Update user verification status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
      })
      .eq('id', contractorId);

    if (userUpdateError) {
      console.error('Failed to update user verification:', userUpdateError);
      // Don't fail the request, just log the error
    }

    // TODO: Send approval notification email to contractor
    console.log(`Contractor approved: ${contractorId}`);

    return NextResponse.json({
      success: true,
      message: 'Contractor approved successfully',
    });
  } catch (error) {
    console.error('Contractor approval error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
