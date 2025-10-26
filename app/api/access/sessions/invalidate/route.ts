import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SecureAuthService } from '@/lib/security/secure-auth-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, invalidateAll } = body;

    const authService = new SecureAuthService();

    if (invalidateAll) {
      await authService.invalidateAllUserSessions(user.id);
    } else if (sessionId) {
      await authService.invalidateSession(sessionId);
    } else {
      return NextResponse.json(
        { error: 'Session ID or invalidateAll flag is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error invalidating session:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate session' },
      { status: 500 }
    );
  }
}
