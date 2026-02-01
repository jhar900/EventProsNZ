import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? undefined : val)),
  video_url: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? undefined : val)),
  video_platform: z.enum(['youtube', 'vimeo']).optional(),
  event_date: z.string().optional(),
  is_visible: z.boolean().default(true),
});

const portfolioUpdateSchema = portfolioItemSchema.extend({
  id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
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

    // First, verify the user exists in public.users (like business profile does)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      // Return empty array instead of error (graceful handling)
      return NextResponse.json({ portfolio: [] });
    }

    // Get user's portfolio using admin client (bypasses RLS)
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (portfolioError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 400 }
      );
    }

    return NextResponse.json({ portfolio: portfolio || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = portfolioItemSchema.parse(body);

    // Create new portfolio item using admin client (bypasses RLS)
    const { data: portfolioItem, error: createError } = await supabaseAdmin
      .from('portfolio')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create portfolio item' },
        { status: 400 }
      );
    }

    return NextResponse.json({ portfolio_item: portfolioItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = portfolioUpdateSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: 'Portfolio item ID is required' },
        { status: 400 }
      );
    }

    // Update portfolio item using admin client (bypasses RLS)
    const { data: portfolioItem, error: updateError } = await supabaseAdmin
      .from('portfolio')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        image_url: validatedData.image_url,
        video_url: validatedData.video_url,
        video_platform: validatedData.video_platform,
        event_date: validatedData.event_date,
        is_visible: validatedData.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update portfolio item' },
        { status: 400 }
      );
    }

    return NextResponse.json({ portfolio_item: portfolioItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
