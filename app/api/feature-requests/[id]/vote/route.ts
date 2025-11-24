import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const voteSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = await Promise.resolve(params);
    const featureRequestId = resolvedParams.id;

    // Try to get user ID from header first (sent by client as fallback)
    let userId = request.headers.get('x-user-id');
    let user: any = null;

    // If no header, try to extract user ID from auth token in cookies
    if (!userId) {
      const authCookie = request.cookies.get(
        'sb-tyzyldvtvzxbmuomwftj-auth-token'
      );
      if (authCookie?.value) {
        try {
          // The cookie value is base64-encoded JSON, but it starts with "base64-"
          const cookieValue = authCookie.value;
          if (cookieValue.startsWith('base64-')) {
            const base64Data = cookieValue.substring(7); // Remove "base64-" prefix
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            const tokenData = JSON.parse(decoded);
            if (tokenData.user?.id) {
              userId = tokenData.user.id;
            }
          }
        } catch (e) {
          // If parsing fails, continue with cookie-based auth
        }
      }
    }

    if (userId) {
      // If we have user ID from header or cookie, verify it exists and use it
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (userData) {
        user = { id: userData.id, email: userData.email, role: userData.role };
      }
    }

    // If no user from header, try cookie-based authentication
    if (!user) {
      const { supabase } = createClient(request);

      // Try to get user - use getSession() first (doesn't refresh), then fallback to getUser()
      let authError: any = null;

      // First try getSession() - this doesn't try to refresh, so it won't fail on invalid refresh tokens
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session?.user) {
        user = session.user;
      } else {
        // If no session, try getUser() - this will attempt to refresh
        const getUserResult = await supabase.auth.getUser();
        user = getUserResult.data.user;
        authError = getUserResult.error;
      }

      // Handle refresh token errors gracefully - if we have a session but refresh fails, that's okay
      if (authError && !user) {
        // Check if it's a refresh token error
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token')
        ) {
          // If we have cookies but no valid session, the session expired
          const hasAuthCookies = request.cookies
            .getAll()
            .some(c => c.name.includes('auth-token'));

          if (hasAuthCookies) {
            return NextResponse.json(
              {
                error: 'Session expired. Please log in again.',
                requiresAuth: true,
                code: 'SESSION_EXPIRED',
              },
              { status: 401 }
            );
          }
        }

        return NextResponse.json(
          {
            error: 'Please log in to vote on feature requests',
            requiresAuth: true,
            details: authError.message,
          },
          { status: 401 }
        );
      }
    }

    // If no user is authenticated, they need to log in to vote
    // (Database requires user_id, so we can't store anonymous votes)
    if (!user) {
      return NextResponse.json(
        {
          error: 'Please log in to vote on feature requests',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vote_type } = voteSchema.parse(body);

    // Use admin client for database operations since we already have authenticated user
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Check if feature request exists
    const { data: featureRequest, error: fetchError } = await supabaseAdmin
      .from('feature_requests')
      .select('id, user_id')
      .eq('id', featureRequestId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Users cannot vote on their own requests
    if (featureRequest.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own feature request' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabaseAdmin
      .from('feature_request_votes')
      .select('id, vote_type')
      .eq('feature_request_id', featureRequestId)
      .eq('user_id', user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      return NextResponse.json(
        {
          error: 'Failed to check existing vote',
          details: voteCheckError.message,
        },
        { status: 500 }
      );
    }

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // User is trying to vote the same way again, remove the vote
        const { error: deleteError } = await supabaseAdmin
          .from('feature_request_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          return NextResponse.json(
            { error: 'Failed to remove vote', details: deleteError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Vote removed',
          vote_type: null,
          action: 'removed',
        });
      } else {
        // User is changing their vote
        const { error: updateError } = await supabaseAdmin
          .from('feature_request_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update vote', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Vote updated',
          vote_type,
          action: 'updated',
        });
      }
    } else {
      // User is voting for the first time
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('feature_request_votes')
        .insert({
          feature_request_id: featureRequestId,
          user_id: user.id,
          vote_type,
        })
        .select();

      if (insertError) {
        return NextResponse.json(
          {
            error: 'Failed to create vote',
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Vote recorded',
        vote_type,
        action: 'created',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/feature-requests/[id]/vote:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = await Promise.resolve(params);
    const featureRequestId = resolvedParams.id;

    // Try to get user - authentication is optional for viewing votes
    let user: any = null;

    // Try to get user ID from header first (sent by client as fallback)
    const userId = request.headers.get('x-user-id');

    if (userId) {
      // If we have user ID from header, verify it exists and use it
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (userData) {
        user = { id: userData.id, email: userData.email, role: userData.role };
      }
    }

    // If no user from header, try cookie-based authentication
    if (!user) {
      try {
        const { supabase } = createClient(request);
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        // Only set user if we successfully got one (ignore auth errors for viewing)
        if (authUser && !authError) {
          user = authUser;
        }
      } catch (e) {
        // Ignore auth errors for viewing votes
      }
    }

    // Get voting data for the feature request
    // Use admin client to bypass RLS
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data: votes, error } = await supabaseAdmin
      .from('feature_request_votes')
      .select('id, vote_type, created_at, user_id')
      .eq('feature_request_id', featureRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching votes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    // Get user's vote if they have one (only if user is authenticated)
    let userVote = null;
    if (user?.id) {
      const { data: voteData } = await supabaseAdmin
        .from('feature_request_votes')
        .select('vote_type')
        .eq('feature_request_id', featureRequestId)
        .eq('user_id', user.id)
        .single();
      userVote = voteData;
    }

    // Calculate vote counts
    const upvotes =
      votes?.filter(vote => vote.vote_type === 'upvote').length || 0;
    const downvotes =
      votes?.filter(vote => vote.vote_type === 'downvote').length || 0;

    return NextResponse.json({
      votes: votes || [],
      vote_counts: {
        upvotes,
        downvotes,
        total: upvotes - downvotes,
      },
      user_vote: userVote?.vote_type || null,
    });
  } catch (error) {
    console.error('Error in GET /api/feature-requests/[id]/vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
