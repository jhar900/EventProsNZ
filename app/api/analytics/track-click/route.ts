import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchAnalyticsService } from '@/lib/analytics/search-analytics';
import { z } from 'zod';

const TrackClickSchema = z.object({
  contractor_id: z.string().uuid(),
  search_query_id: z.string().uuid().optional(),
  click_position: z.number().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = TrackClickSchema.parse(body);

    // Track the click
    const result = await searchAnalyticsService.trackSearchClick({
      user_id: user.id,
      contractor_id: validatedData.contractor_id,
      search_query_id: validatedData.search_query_id,
      click_position: validatedData.click_position,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      click_id: result.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
