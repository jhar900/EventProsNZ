import { SupabaseClient } from '@supabase/supabase-js';

export interface SuspensionStatus {
  isSuspended: boolean;
  reason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
}

export async function checkUserSuspension(
  supabase: SupabaseClient,
  userId: string
): Promise<SuspensionStatus> {
  const { data: user, error } = await supabase
    .from('users')
    .select('status, suspension_reason, suspended_at, suspended_by')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { isSuspended: false };
  }

  return {
    isSuspended: user.status === 'suspended',
    reason: user.suspension_reason || undefined,
    suspendedAt: user.suspended_at || undefined,
    suspendedBy: user.suspended_by || undefined,
  };
}

export function getSuspensionErrorMessage(
  suspensionStatus: SuspensionStatus
): string {
  if (!suspensionStatus.isSuspended) {
    return '';
  }

  let message = 'Your account has been suspended.';
  if (suspensionStatus.reason) {
    message += ` Reason: ${suspensionStatus.reason}`;
  }
  if (suspensionStatus.suspendedAt) {
    const date = new Date(suspensionStatus.suspendedAt);
    message += ` Suspended on: ${date.toLocaleDateString()}`;
  }
  return message;
}
