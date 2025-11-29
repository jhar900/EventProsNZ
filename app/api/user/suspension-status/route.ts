import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { checkUserSuspension } from '@/lib/security/suspension-check';

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first (like business profile does)
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { supabase } = createClient(request);

      // Get current user - use getSession() first to avoid refresh token errors
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      // If no session, try getUser (but handle refresh token errors)
      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        // Handle refresh token errors gracefully
        if (authError) {
          if (
            authError.message?.includes('refresh_token_not_found') ||
            authError.message?.includes('Invalid Refresh Token') ||
            authError.message?.includes('Refresh Token Not Found')
          ) {
            return NextResponse.json(
              {
                error: 'Session expired. Please log in again.',
                code: 'SESSION_EXPIRED',
              },
              { status: 401 }
            );
          }
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        user = getUserUser;
      }

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
    }

    // Verify the user exists in public.users (like business profile does)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check suspension status using admin client (bypasses RLS)
    const suspensionStatus = await checkUserSuspension(supabaseAdmin, userId);

    // Add cache headers - suspension status doesn't change frequently
    // Cache for 1 minute, but allow stale-while-revalidate for 30 seconds
    const response = NextResponse.json({
      isSuspended: suspensionStatus.isSuspended,
      reason: suspensionStatus.reason,
      suspendedAt: suspensionStatus.suspendedAt,
    });

    response.headers.set(
      'Cache-Control',
      'private, max-age=60, stale-while-revalidate=30'
    );

    return response;
  } catch (error) {
    console.error('Error fetching suspension status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
