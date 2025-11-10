import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment is required')
    .max(2000, 'Comment too long'),
});

// GET /api/feature-requests/[id]/comments - Get comments for a feature request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const resolvedParams = params instanceof Promise ? await params : params;
    const featureRequestId = resolvedParams.id;

    // Get user for authentication (optional - comments are public)
    let user: any;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      const {
        data: { user: getUserUser },
      } = await supabase.auth.getUser();
      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user_id from header
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData } = await adminSupabase
          .from('users')
          .select('id, email')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = { id: userData.id, email: userData.email || '' } as any;
        }
      }
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('feature_request_comments')
      .select('*')
      .eq('feature_request_id', featureRequestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }

    // Fetch profiles separately if needed
    const userIds = comments?.map((c: any) => c.user_id).filter(Boolean) || [];
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        profilesMap = profiles.reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
    }

    // Attach profiles to comments
    const commentsWithProfiles =
      comments?.map((comment: any) => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || null,
      })) || [];

    return NextResponse.json({ comments: commentsWithProfiles });
  } catch (error) {
    console.error('Error in GET /api/feature-requests/[id]/comments:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/feature-requests/[id]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const resolvedParams = params instanceof Promise ? await params : params;
    const featureRequestId = resolvedParams.id;

    // Get user - authentication required for posting comments
    let user: any;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      const {
        data: { user: getUserUser },
      } = await supabase.auth.getUser();
      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user_id from header
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Use server client if authenticated via header (bypasses RLS)
    const userIdFromHeader =
      request.headers.get('x-user-id') ||
      request.headers.get('X-User-Id') ||
      request.headers.get('X-USER-ID');

    const useServerClient = userIdFromHeader === user.id;
    const insertClient = useServerClient
      ? (await import('@/lib/supabase/server')).createClient()
      : supabase;

    const { data: comment, error: insertError } = await insertClient
      .from('feature_request_comments')
      .insert({
        feature_request_id: featureRequestId,
        user_id: user.id,
        content: validatedData.content,
        is_admin_comment: user.role === 'admin',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Fetch profile for the comment
    let profile = null;
    if (comment) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .eq('user_id', comment.user_id)
        .single();

      if (profileData) {
        profile = profileData;
      }
    }

    const commentWithProfile = comment
      ? {
          ...comment,
          profiles: profile,
        }
      : null;

    return NextResponse.json({ comment: commentWithProfile }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/feature-requests/[id]/comments:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
