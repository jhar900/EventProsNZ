import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getPublicRoadmapSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(parseInt(val) || 50, 100)),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 0),
});

// GET /api/roadmap/public - Get public roadmap data
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getPublicRoadmapSchema.parse(queryParams);

    const { status, limit, offset } = validatedParams;

    // Build query for public roadmap items
    let query = supabase
      .from('roadmap_milestones')
      .select(
        `
        id,
        title,
        description,
        status,
        target_date,
        created_at,
        updated_at,
        feature_requests(
          id,
          title,
          vote_count,
          status
        )
        `,
        { count: 'exact' }
      )
      .eq('is_public', true);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting and pagination
    query = query.order('target_date', { ascending: true });
    query = query.range(offset, offset + limit - 1);

    const { data: milestones, error: milestonesError, count } = await query;

    if (milestonesError) {
      console.error('Error fetching public roadmap:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch roadmap' },
        { status: 500 }
      );
    }

    // Get roadmap settings
    const { data: settings, error: settingsError } = await supabase
      .from('public_roadmap_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (settingsError) {
      console.error('Error fetching roadmap settings:', settingsError);
      // Continue without settings if they don't exist
    }

    return NextResponse.json({
      milestones: milestones || [],
      settings: settings || {
        enabled: true,
        show_votes: true,
        show_comments: true,
        allow_feedback: true,
        theme: 'light',
        layout: 'timeline',
      },
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/roadmap/public:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
