import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  video_platform: z.enum(['youtube', 'vimeo']).optional(),
  event_date: z.string().optional(),
  is_visible: z.boolean().default(true),
});

const portfolioUpdateSchema = portfolioItemSchema.extend({
  id: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify the user exists
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ portfolio: [] });
    }

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await adminSupabase
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

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify the user exists
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = portfolioItemSchema.parse(body);

    // Create new portfolio item
    const { data: portfolioItem, error: createError } = await adminSupabase
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify the user exists
    const { data: userData, error: userError } = await adminSupabase
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

    // Update portfolio item
    const { data: portfolioItem, error: updateError } = await adminSupabase
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
