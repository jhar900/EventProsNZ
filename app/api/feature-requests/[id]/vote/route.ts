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

    // Log incoming cookies for debugging
    const cookieHeader = request.headers.get('cookie');
    const cookies = request.cookies.getAll();
    console.log('Vote route - Incoming cookies:', {
      cookieHeader: cookieHeader ? 'present' : 'missing',
      cookieHeaderPreview: cookieHeader
        ? cookieHeader.substring(0, 100) + '...'
        : null,
      cookieCount: cookies.length,
      cookieNames: cookies.map(c => c.name),
      cookieDetails: cookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      featureRequestId,
    });

    const { supabase } = createClient(request);

    // Try to get user from session first (better cookie handling)
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('Vote route - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    if (session?.user) {
      user = session.user;
      console.log('Vote route - User authenticated from session:', user.id);
    } else {
      // Fallback to getUser
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('Vote route - getUser check:', {
        hasUser: !!getUserUser,
        userId: getUserUser?.id,
        authError: authError?.message,
      });

      if (authError) {
        console.error('Auth error:', authError);
      }

      if (getUserUser) {
        user = getUserUser;
        console.log('Vote route - User authenticated from getUser:', user.id);
      } else {
        console.error(
          'Vote route - No user found. Session:',
          session,
          'Auth error:',
          authError
        );
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!user) {
      console.error('User is null after authentication check');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vote_type } = voteSchema.parse(body);

    // Check if feature request exists
    const { data: featureRequest, error: fetchError } = await supabase
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
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('feature_request_votes')
      .select('id, vote_type')
      .eq('feature_request_id', featureRequestId)
      .eq('user_id', user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      );
    }

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // User is trying to vote the same way again, remove the vote
        const { error: deleteError } = await supabase
          .from('feature_request_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove vote' },
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
        const { error: updateError } = await supabase
          .from('feature_request_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        if (updateError) {
          console.error('Error updating vote:', updateError);
          return NextResponse.json(
            { error: 'Failed to update vote' },
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
      const { error: insertError } = await supabase
        .from('feature_request_votes')
        .insert({
          feature_request_id: featureRequestId,
          user_id: user.id,
          vote_type,
        });

      if (insertError) {
        console.error('Error creating vote:', insertError);
        return NextResponse.json(
          { error: 'Failed to create vote' },
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

    const { supabase } = createClient(request);

    // Try to get user from session first (better cookie handling)
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      // Fallback to getUser
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get voting data for the feature request
    const { data: votes, error } = await supabase
      .from('feature_request_votes')
      .select(
        `
        id,
        vote_type,
        created_at,
        profiles(first_name, last_name, avatar_url)
      `
      )
      .eq('feature_request_id', featureRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching votes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    // Get user's vote if they have one
    const { data: userVote } = await supabase
      .from('feature_request_votes')
      .select('vote_type')
      .eq('feature_request_id', featureRequestId)
      .eq('user_id', user.id)
      .single();

    // Calculate vote counts
    const upvotes =
      votes?.filter(vote => vote.vote_type === 'upvote').length || 0;
    const downvotes =
      votes?.filter(vote => vote.vote_type === 'downvote').length || 0;

    return NextResponse.json({
      votes,
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
