import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  is_admin_comment: z.boolean().optional(),
});

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

    const { data: comments, error } = await supabase
      .from('feature_request_comments')
      .select(
        `
        *,
        profiles(first_name, last_name, avatar_url)
      `
      )
      .eq('feature_request_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error in GET /api/feature-requests/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { content, is_admin_comment } = createCommentSchema.parse(body);

    // Check if feature request exists
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check if user is admin for admin comments
    if (is_admin_comment) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can create admin comments' },
          { status: 403 }
        );
      }
    }

    // Create the comment
    const { data: comment, error: insertError } = await supabase
      .from('feature_request_comments')
      .insert({
        feature_request_id: params.id,
        user_id: user.id,
        content,
        is_admin_comment: is_admin_comment || false,
      })
      .select(
        `
        *,
        profiles(first_name, last_name, avatar_url)
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/feature-requests/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
