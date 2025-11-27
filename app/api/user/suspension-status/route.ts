import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkUserSuspension } from '@/lib/security/suspension-check';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suspensionStatus = await checkUserSuspension(supabase, user.id);

    return NextResponse.json({
      isSuspended: suspensionStatus.isSuspended,
      reason: suspensionStatus.reason,
      suspendedAt: suspensionStatus.suspendedAt,
    });
  } catch (error) {
    console.error('Error fetching suspension status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
