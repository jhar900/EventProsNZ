import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get contractors with their onboarding status
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('contractor_onboarding_status')
      .select(
        `
        *,
        users!inner(email, created_at),
        profiles!inner(first_name, last_name, phone),
        business_profiles!inner(company_name, business_address, description)
      `
      )
      .order('created_at', { ascending: false });

    if (contractorsError) {
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contractors });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
