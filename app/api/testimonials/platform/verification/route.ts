import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/testimonials/platform/verification - Get user verification status
export async function GET(request: NextRequest) {
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

    // Get user verification status
    const { data: verifications, error: verificationError } = await supabase
      .from('user_verification')
      .select('verification_type, status')
      .eq('user_id', user.id);

    if (verificationError) {
      console.error('Error fetching verification status:', verificationError);
      return NextResponse.json(
        { error: 'Failed to fetch verification status' },
        { status: 500 }
      );
    }

    // Transform data into status object
    const verificationStatus = {
      email: 'pending' as const,
      phone: 'pending' as const,
      identity: 'pending' as const,
      business: 'pending' as const,
    };

    verifications?.forEach(verification => {
      verificationStatus[
        verification.verification_type as keyof typeof verificationStatus
      ] = verification.status as 'pending' | 'verified' | 'rejected';
    });

    return NextResponse.json({ verification: verificationStatus });
  } catch (error) {
    console.error(
      'Error in GET /api/testimonials/platform/verification:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
