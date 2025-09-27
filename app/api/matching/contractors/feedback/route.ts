import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MatchingFeedback } from '@/types/matching';

export async function POST(request: NextRequest) {
  try {
    const body: MatchingFeedback = await request.json();
    const { match_id, feedback_type, rating, comments } = body;

    if (!match_id || !feedback_type || rating === undefined) {
      return NextResponse.json(
        { error: 'Match ID, feedback type, and rating are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update the match with feedback
    const { data: updatedMatch, error } = await supabase
      .from('contractor_matches')
      .update({
        feedback_type,
        feedback_rating: rating,
        feedback_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update match feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated_match: updatedMatch,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process match feedback' },
      { status: 500 }
    );
  }
}
