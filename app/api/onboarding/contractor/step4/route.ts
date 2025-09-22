import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  event_date: z.string().optional(),
});

const step4Schema = z.object({
  portfolio_items: z
    .array(portfolioItemSchema)
    .min(1, 'At least one portfolio item is required'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = step4Schema.parse(body);

    // Validate YouTube URLs if provided
    for (const item of validatedData.portfolio_items) {
      if (
        item.video_url &&
        !item.video_url.includes('youtube.com') &&
        !item.video_url.includes('youtu.be')
      ) {
        return NextResponse.json(
          { error: 'Only YouTube video URLs are supported' },
          { status: 400 }
        );
      }
    }

    // Delete existing portfolio items for this user
    await supabase.from('portfolio').delete().eq('user_id', user.id);

    // Insert new portfolio items
    const portfolioItemsWithUserId = validatedData.portfolio_items.map(
      item => ({
        ...item,
        user_id: user.id,
      })
    );

    const { data: portfolio, error: createError } = await supabase
      .from('portfolio')
      .insert(portfolioItemsWithUserId)
      .select();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create portfolio items' },
        { status: 500 }
      );
    }

    // Update onboarding status
    await supabase.from('contractor_onboarding_status').upsert({
      user_id: user.id,
      step4_completed: true,
    });

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio items created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Contractor Step 4 error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
