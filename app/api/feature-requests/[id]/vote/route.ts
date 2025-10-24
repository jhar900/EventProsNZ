import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const voteSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vote_type } = voteSchema.parse(body);

    // Check if feature request exists
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, user_id')
      .eq('id', params.id)
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
      .eq('feature_request_id', params.id)
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
          feature_request_id: params.id,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
      .eq('feature_request_id', params.id)
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
      .eq('feature_request_id', params.id)
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
