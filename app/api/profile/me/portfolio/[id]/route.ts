import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user ID from header first
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

    // Verify the user exists (like business profile does)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const portfolioId = params.id;

    // Delete portfolio item using admin client (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('portfolio')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete portfolio item' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
