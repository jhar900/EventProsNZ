import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  checkUserSuspension,
  getSuspensionErrorMessage,
} from '@/lib/security/suspension-check';

export async function checkSuspensionAndBlock(
  request: NextRequest,
  userId: string,
  supabase: SupabaseClient
): Promise<NextResponse | null> {
  const suspensionStatus = await checkUserSuspension(supabase, userId);

  if (suspensionStatus.isSuspended) {
    return NextResponse.json(
      {
        error: 'Your account has been suspended',
        message: getSuspensionErrorMessage(suspensionStatus),
        reason: suspensionStatus.reason,
        suspendedAt: suspensionStatus.suspendedAt,
      },
      { status: 403 }
    );
  }

  return null; // Not suspended, allow request
}
